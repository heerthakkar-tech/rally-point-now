-- Fix RLS policies for event creation and ensure default roles

-- Drop and recreate the event creation policy to fix the INSERT issue
DROP POLICY IF EXISTS "Event managers and admins can create events" ON public.events;

CREATE POLICY "Event managers and admins can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = organizer_id) AND 
  (has_role(auth.uid(), 'event_manager') OR has_role(auth.uid(), 'admin'))
);

-- Ensure users get a default participant role when they sign up
-- First, create a function to handle new user role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only assign participant role if no role exists yet
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'participant');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to assign default role after profile creation
DROP TRIGGER IF EXISTS on_auth_user_role_created ON auth.users;
CREATE TRIGGER on_auth_user_role_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();