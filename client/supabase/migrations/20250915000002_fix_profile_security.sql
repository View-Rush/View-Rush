-- Fix security vulnerability: Replace overly permissive profile access policy
-- This migration restricts profile access to authenticated users viewing their own profiles only

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a secure policy that only allows users to view their own profiles
CREATE POLICY "Users can only view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Optionally, create a policy for admins to view all profiles (uncomment if needed)
-- CREATE POLICY "Admins can view all profiles" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM auth.users 
--     WHERE auth.users.id = auth.uid() 
--     AND auth.users.raw_app_meta_data->>'role' = 'admin'
--   )
-- );