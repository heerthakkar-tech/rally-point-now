-- Create a function to auto-assign admin role to specific emails
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user's email is one of the admin emails
  IF NEW.email IN ('heerthakkar223@gmail.com', 'omkarsinh.04@gmail.com') THEN
    -- Insert admin role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also mark as organizer in profile
    UPDATE public.profiles
    SET is_organizer = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-assign admin role
DROP TRIGGER IF EXISTS on_auth_user_admin_check ON auth.users;
CREATE TRIGGER on_auth_user_admin_check
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Ensure admin users can view all user emails by creating a view
CREATE OR REPLACE VIEW public.user_emails AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u;

-- Grant access to this view for authenticated users with admin role
GRANT SELECT ON public.user_emails TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.user_emails SET (security_invoker = on);

-- Add policy to allow admins to manage event_categories
CREATE POLICY "Admins can manage categories"
ON public.event_categories
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));