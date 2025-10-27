-- Create app_role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('owner', 'organizer', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owners can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owners can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owners can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'owner'));

-- Update events RLS policies to use new role system
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update their own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete their own events" ON public.events;

CREATE POLICY "Organizers and owners can create events"
ON public.events
FOR INSERT
WITH CHECK (
  auth.uid() = organizer_id AND 
  (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'owner'))
);

CREATE POLICY "Organizers can update their own events, owners can update all"
ON public.events
FOR UPDATE
USING (
  auth.uid() = organizer_id OR 
  public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Organizers can delete their own events, owners can delete all"
ON public.events
FOR DELETE
USING (
  auth.uid() = organizer_id OR 
  public.has_role(auth.uid(), 'owner')
);

-- Insert sample events (using a demo organizer ID - will need to be updated with real user)
-- First, create a function to insert sample data that can be called after users exist
CREATE OR REPLACE FUNCTION public.insert_sample_events(_organizer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  music_cat_id UUID;
  tech_cat_id UUID;
  sports_cat_id UUID;
  education_cat_id UUID;
  festival_cat_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO music_cat_id FROM event_categories WHERE slug = 'music';
  SELECT id INTO tech_cat_id FROM event_categories WHERE slug = 'technology';
  SELECT id INTO sports_cat_id FROM event_categories WHERE slug = 'sports';
  SELECT id INTO education_cat_id FROM event_categories WHERE slug = 'education';
  SELECT id INTO festival_cat_id FROM event_categories WHERE slug = 'festivals';

  -- Insert sample events
  INSERT INTO public.events (title, description, category_id, location, start_date, end_date, ticket_price, total_tickets, available_tickets, organizer_id, status, image_url) VALUES
  ('Mumbai Music Festival 2025', 'Experience the biggest music festival in Mumbai featuring top artists from India and abroad. Three days of non-stop music, food, and entertainment.', music_cat_id, 'Mahalaxmi Race Course, Mumbai, Maharashtra', '2025-03-15 18:00:00+05:30', '2025-03-17 23:00:00+05:30', 2500, 5000, 5000, _organizer_id, 'upcoming', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'),
  
  ('Delhi Tech Summit 2025', 'Join us for the biggest technology conference in North India. Network with industry leaders, attend workshops, and learn about the latest in AI, blockchain, and cloud computing.', tech_cat_id, 'India Habitat Centre, New Delhi', '2025-02-20 09:00:00+05:30', '2025-02-22 18:00:00+05:30', 1500, 2000, 2000, _organizer_id, 'upcoming', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'),
  
  ('Bangalore Marathon 2025', 'Run for a cause! Join thousands of runners in Bangalore''s biggest marathon. Categories for all ages and fitness levels.', sports_cat_id, 'Cubbon Park, Bangalore, Karnataka', '2025-01-28 06:00:00+05:30', '2025-01-28 12:00:00+05:30', 500, 10000, 10000, _organizer_id, 'upcoming', 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800'),
  
  ('Digital Marketing Masterclass', 'Learn from industry experts about SEO, social media marketing, content strategy, and growth hacking. Perfect for entrepreneurs and marketing professionals.', education_cat_id, 'Online Webinar', '2025-02-05 19:00:00+05:30', '2025-02-05 21:00:00+05:30', 299, 500, 500, _organizer_id, 'upcoming', 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800'),
  
  ('Holi Festival Celebration', 'Celebrate the festival of colors with music, dance, traditional food, and lots of colors! Family-friendly event with special zones for kids.', festival_cat_id, 'Nehru Park, Pune, Maharashtra', '2025-03-14 11:00:00+05:30', '2025-03-14 17:00:00+05:30', 0, NULL, NULL, _organizer_id, 'upcoming', 'https://images.unsplash.com/photo-1585859729828-1b27be7fc4b2?w=800'),
  
  ('Startup Pitch Competition', 'Present your startup idea to a panel of investors and industry experts. Win funding and mentorship opportunities.', tech_cat_id, 'T-Hub, Hyderabad, Telangana', '2025-02-28 14:00:00+05:30', '2025-02-28 19:00:00+05:30', 0, 100, 100, _organizer_id, 'upcoming', 'https://images.unsplash.com/photo-1559223607-a43c990c3a64?w=800'),
  
  ('Classical Dance Festival', 'A mesmerizing evening of classical Indian dance forms including Bharatanatyam, Kathak, Odissi, and Kuchipudi performed by renowned artists.', music_cat_id, 'Kamani Auditorium, New Delhi', '2025-03-08 18:30:00+05:30', '2025-03-08 22:00:00+05:30', 800, 500, 500, _organizer_id, 'upcoming', 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800'),
  
  ('Food & Wine Festival', 'Explore cuisines from around India and the world. Wine tastings, cooking demonstrations, and celebrity chef appearances.', festival_cat_id, 'Jawaharlal Nehru Stadium, Chennai, Tamil Nadu', '2025-04-12 12:00:00+05:30', '2025-04-14 22:00:00+05:30', 1200, 3000, 3000, _organizer_id, 'upcoming', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800');
END;
$$;