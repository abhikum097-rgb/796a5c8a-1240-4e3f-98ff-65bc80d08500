
-- 1) Create roles enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END$$;

-- 2) Create user_roles table for assigning roles to users
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- (Intentionally no INSERT/UPDATE/DELETE policies here - roles managed by admins only outside the app UI)

-- 3) Security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 4) Restrict write access on questions to admins only
-- Insert policy
DROP POLICY IF EXISTS "Only admins can insert questions" ON public.questions;
CREATE POLICY "Only admins can insert questions"
  ON public.questions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update policy
DROP POLICY IF EXISTS "Only admins can update questions" ON public.questions;
CREATE POLICY "Only admins can update questions"
  ON public.questions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Delete policy
DROP POLICY IF EXISTS "Only admins can delete questions" ON public.questions;
CREATE POLICY "Only admins can delete questions"
  ON public.questions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
