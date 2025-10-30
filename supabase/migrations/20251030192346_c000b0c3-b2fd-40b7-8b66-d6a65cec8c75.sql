-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more restrictive policy
CREATE POLICY "Users can view own profile and event organizers"
ON public.profiles
FOR SELECT
USING (
  -- Users can view their own profile
  auth.uid() = id
  OR
  -- Anyone can view profiles of event organizers (since events are public)
  id IN (SELECT DISTINCT organizer_id FROM public.events)
  OR
  -- Admins can view all profiles
  public.has_role(auth.uid(), 'admin'::app_role)
);