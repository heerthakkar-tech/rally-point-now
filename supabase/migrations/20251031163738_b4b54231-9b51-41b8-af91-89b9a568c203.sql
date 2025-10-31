-- Drop the trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_updated_assign_admin ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Create trigger for email updates (in case user changes email)
CREATE TRIGGER on_auth_user_email_updated_assign_admin
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Assign admin role to existing admin users immediately
-- This is a one-time fix for users who already exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email IN ('heerthakkar223@gmail.com', 'omkarsinh.04@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also update their is_organizer flag
UPDATE public.profiles
SET is_organizer = true
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('heerthakkar223@gmail.com', 'omkarsinh.04@gmail.com')
);