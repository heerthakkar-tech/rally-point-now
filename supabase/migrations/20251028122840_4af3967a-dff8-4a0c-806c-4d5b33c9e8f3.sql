-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reminder job to run at midnight IST (18:30 UTC for 00:00 IST)
SELECT cron.schedule(
  'send-daily-event-reminders',
  '30 18 * * *',  -- 18:30 UTC = 00:00 IST
  $$
  SELECT
    net.http_post(
        url:=CONCAT('https://cbhivhunephxlyiocruz.supabase.co/functions/v1/send-daily-reminders'),
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiaGl2aHVuZXBoeGx5aW9jcnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODQ3MDksImV4cCI6MjA3NzA2MDcwOX0.3Ky13Dn9f7Y53X0B5Vh3ffTye3imWY97EmSj1koHYg4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);