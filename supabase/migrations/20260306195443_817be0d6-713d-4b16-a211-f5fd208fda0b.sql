-- Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to manage artefact_files (insert/delete)
CREATE POLICY "Admins can insert artefact files"
  ON public.artefact_files FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete artefact files"
  ON public.artefact_files FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for artefact-files bucket: admin upload/delete
CREATE POLICY "Admins can upload artefact files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'artefact-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete artefact storage files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'artefact-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read artefact storage files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'artefact-files');

-- Assign admin role to the user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'archit.chaturvedi31@gmail.com';