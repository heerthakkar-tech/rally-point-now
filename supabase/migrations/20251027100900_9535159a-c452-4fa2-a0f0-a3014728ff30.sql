-- Fix search_path for existing functions

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Update insert_sample_events function
CREATE OR REPLACE FUNCTION public.insert_sample_events(_organizer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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