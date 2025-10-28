-- Step 1: Drop existing constraints and policies that depend on the enum
DROP POLICY IF EXISTS "Only owners can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Organizers and owners can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update their own events, owners can update all" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete their own events, owners can delete all" ON public.events;

-- Step 2: Drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Step 3: Recreate user_roles table with new enum
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('admin', 'event_manager', 'volunteer', 'participant');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: Create RLS policies for user_roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles, admins can view all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Step 6: Update event policies
CREATE POLICY "Event managers and admins can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = organizer_id AND (
    has_role(auth.uid(), 'event_manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Event managers can update their own events, admins can update all"
ON public.events
FOR UPDATE
TO authenticated
USING (
  auth.uid() = organizer_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Event managers can delete their own events, admins can delete all"
ON public.events
FOR DELETE
TO authenticated
USING (
  auth.uid() = organizer_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Step 7: Add additional policies for admin access
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);