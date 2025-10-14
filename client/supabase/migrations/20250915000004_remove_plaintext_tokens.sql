-- PHASE 2: Remove plain text token columns after encryption verification
-- This migration should only be run AFTER verifying that all tokens 
-- have been successfully encrypted and the application is working properly

-- Verify all tokens have been migrated before proceeding
DO $$
DECLARE
  unmigrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmigrated_count
  FROM public.channel_connections
  WHERE access_token IS NOT NULL 
    AND (access_token_migrated IS FALSE OR access_token_migrated IS NULL);
  
  IF unmigrated_count > 0 THEN
    RAISE EXCEPTION 'Found % unmigrated tokens. Migration incomplete.', unmigrated_count;
  END IF;
  
  RAISE NOTICE 'All tokens have been migrated. Proceeding with column removal.';
END;
$$;

-- Drop the backup trigger
DROP EVENT TRIGGER IF EXISTS prevent_token_column_drop;
DROP FUNCTION IF EXISTS prevent_token_column_drop();

-- Remove plain text token columns
ALTER TABLE public.channel_connections 
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token,
DROP COLUMN IF EXISTS access_token_migrated,
DROP COLUMN IF EXISTS refresh_token_migrated;

-- Update any indexes that referenced the old columns
-- (They should be automatically dropped, but let's be explicit)
DROP INDEX IF EXISTS idx_channel_connections_access_token;
DROP INDEX IF EXISTS idx_channel_connections_refresh_token;

-- Create audit log for security compliance
CREATE TABLE public.token_access_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID NOT NULL REFERENCES public.channel_connections(id),
  action TEXT NOT NULL CHECK (action IN ('decrypt', 'store', 'refresh')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit table
ALTER TABLE public.token_access_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for audit table (admins only)
CREATE POLICY "Only service can access token audit logs" 
ON public.token_access_audit 
FOR ALL
USING (false); -- No direct access, only through functions

-- Update token functions to include audit logging
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

  -- Log the access attempt
  INSERT INTO public.token_access_audit (user_id, connection_id, action)
  VALUES (auth.uid(), p_connection_id, 'decrypt');

  RETURN QUERY
  SELECT 
    decrypt_token(et.encrypted_access_token) as access_token,
    decrypt_token(et.encrypted_refresh_token) as refresh_token
  FROM public.encrypted_tokens et
  WHERE et.connection_id = p_connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  -- Log the storage attempt
  INSERT INTO public.token_access_audit (user_id, connection_id, action)
  VALUES (auth.uid(), p_connection_id, 'store');

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

-- Grant permissions for audit table
GRANT SELECT ON public.token_access_audit TO service_role;

-- Create index for audit performance
CREATE INDEX idx_token_access_audit_user_timestamp 
ON public.token_access_audit(user_id, timestamp DESC);

CREATE INDEX idx_token_access_audit_connection 
ON public.token_access_audit(connection_id, timestamp DESC);