
-- Add 'auditor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';

-- Add missing columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Allow admins to manage user_roles
CREATE POLICY "Admins can insert user_roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles" ON public.user_roles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Admins can view all user_roles
CREATE POLICY "Admins can select all user_roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
