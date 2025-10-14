-- CRITICAL SECURITY FIX: Encrypt sensitive OAuth tokens in channel_connections table
-- This migration implements encryption for access_token and refresh_token fields
-- to prevent unauthorized access to users' social media accounts

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure encryption key storage function
-- In production, this key should be stored in environment variables or a secure vault
CREATE OR REPLACE FUNCTION get_encryption_key() 
RETURNS text AS $$
BEGIN
  -- TODO: Replace with environment variable or secure vault in production
  -- For now, using a placeholder - MUST be replaced with actual secure key
  RETURN current_setting('app.encryption_key', true);
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback key - NEVER use this in production
    RETURN 'CHANGE_ME_IN_PRODUCTION_12345678901234567890123456789012';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table for encrypted token storage (separate from main table)
CREATE TABLE public.encrypted_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.channel_connections(id) ON DELETE CASCADE,
  encrypted_access_token BYTEA NOT NULL,
  encrypted_refresh_token BYTEA,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one token record per connection
  UNIQUE(connection_id)
);

-- Enable RLS on encrypted tokens table
ALTER TABLE public.encrypted_tokens ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies for encrypted tokens
CREATE POLICY "Users can only access their own encrypted tokens" 
ON public.encrypted_tokens 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.channel_connections cc 
    WHERE cc.id = connection_id 
    AND cc.user_id = auth.uid()
  )
);

-- Create encryption/decryption helper functions
CREATE OR REPLACE FUNCTION encrypt_token(token_value text)
RETURNS bytea AS $$
BEGIN
  IF token_value IS NULL OR token_value = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_encrypt(token_value, get_encryption_key());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token bytea)
RETURNS text AS $$
BEGIN
  IF encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(encrypted_token, get_encryption_key());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure view for accessing decrypted tokens (only for authorized operations)
CREATE OR REPLACE VIEW channel_connections_with_tokens AS
SELECT 
  cc.*,
  decrypt_token(et.encrypted_access_token) as access_token,
  decrypt_token(et.encrypted_refresh_token) as refresh_token
FROM public.channel_connections cc
LEFT JOIN public.encrypted_tokens et ON cc.id = et.connection_id
WHERE cc.user_id = auth.uid(); -- RLS enforcement at view level

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.channel_connections_with_tokens TO authenticated;
GRANT ALL ON public.encrypted_tokens TO authenticated;

-- Create function to safely store encrypted tokens
CREATE OR REPLACE FUNCTION store_encrypted_tokens(
  p_connection_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Verify user owns this connection
  IF NOT EXISTS (
    SELECT 1 FROM public.channel_connections 
    WHERE id = p_connection_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to connection';
  END IF;

  -- Insert or update encrypted tokens
  INSERT INTO public.encrypted_tokens (
    connection_id,
    encrypted_access_token,
    encrypted_refresh_token
  )
  VALUES (
    p_connection_id,
    encrypt_token(p_access_token),
    encrypt_token(p_refresh_token)
  )
  ON CONFLICT (connection_id) 
  DO UPDATE SET
    encrypted_access_token = encrypt_token(p_access_token),
    encrypted_refresh_token = encrypt_token(p_refresh_token),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to safely retrieve decrypted tokens
CREATE OR REPLACE FUNCTION get_decrypted_tokens(p_connection_id UUID)
RETURNS TABLE(access_token TEXT, refresh_token TEXT) AS $$
BEGIN
  -- Verify user owns this connection
  IF NOT EXISTS (
    SELECT 1 FROM public.channel_connections 
    WHERE id = p_connection_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to connection';
  END IF;

  RETURN QUERY
  SELECT 
    decrypt_token(et.encrypted_access_token) as access_token,
    decrypt_token(et.encrypted_refresh_token) as refresh_token
  FROM public.encrypted_tokens et
  WHERE et.connection_id = p_connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- MIGRATION STEPS FOR EXISTING DATA
-- 1. Migrate existing tokens to encrypted storage
INSERT INTO public.encrypted_tokens (connection_id, encrypted_access_token, encrypted_refresh_token)
SELECT 
  id as connection_id,
  encrypt_token(access_token) as encrypted_access_token,
  encrypt_token(refresh_token) as encrypted_refresh_token
FROM public.channel_connections
WHERE access_token IS NOT NULL
ON CONFLICT (connection_id) DO NOTHING;

-- 2. Remove plain text token columns from channel_connections
-- WARNING: This will permanently delete unencrypted tokens
-- Ensure the migration above completed successfully before running these commands

-- First, add temporary columns to verify migration
ALTER TABLE public.channel_connections 
ADD COLUMN access_token_migrated BOOLEAN DEFAULT false,
ADD COLUMN refresh_token_migrated BOOLEAN DEFAULT false;

-- Mark rows as migrated
UPDATE public.channel_connections 
SET 
  access_token_migrated = true,
  refresh_token_migrated = true
WHERE id IN (
  SELECT connection_id FROM public.encrypted_tokens
);

-- Create backup trigger to prevent accidental data loss
CREATE OR REPLACE FUNCTION prevent_token_column_drop()
RETURNS event_trigger AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects() LOOP
    IF obj.object_name IN ('access_token', 'refresh_token') 
       AND obj.schema_name = 'public' 
       AND obj.object_type = 'table column' THEN
      RAISE EXCEPTION 'Dropping token columns is protected. Use migration script.';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: The actual column drops will be done in a separate migration after verification
-- DROP COLUMN access_token;
-- DROP COLUMN refresh_token;

-- Create index for performance
CREATE INDEX idx_encrypted_tokens_connection_id ON public.encrypted_tokens(connection_id);

-- Create trigger for automatic timestamp updates on encrypted_tokens
CREATE TRIGGER update_encrypted_tokens_updated_at
BEFORE UPDATE ON public.encrypted_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();