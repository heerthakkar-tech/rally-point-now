import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventAttendee {
  user_id: string;
  tickets_count: number;
  profiles: {
    full_name: string;
  };
}

interface Event {
  id: string;
  title: string;
  location: string;
  start_date: string;
  event_attendees: EventAttendee[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily reminder job...");

    // Get tomorrow's date range (00:00 to 23:59)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    console.log(`Checking for events between ${tomorrow.toISOString()} and ${dayAfterTomorrow.toISOString()}`);

    // Fetch events scheduled for tomorrow with attendees
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(`
        id,
        title,
        location,
        start_date,
        event_attendees!inner(
          user_id,
          tickets_count,
          profiles!inner(full_name)
        )
      `)
      .gte("start_date", tomorrow.toISOString())
      .lt("start_date", dayAfterTomorrow.toISOString())
      .eq("status", "upcoming");

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${events?.length || 0} events for tomorrow`);

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events scheduled for tomorrow" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send reminder emails for each event
    for (const event of events as unknown as Event[]) {
      console.log(`Processing event: ${event.title} with ${event.event_attendees.length} attendees`);

      for (const attendee of event.event_attendees) {
        try {
          // Get user email from auth
          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          
          if (!authUser?.user?.email) {
            console.log(`No email found for user ${attendee.user_id}`);
            continue;
          }

          const eventDate = new Date(event.start_date);
          const formattedDate = eventDate.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const formattedTime = eventDate.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // Send email using Resend
          const emailResponse = await resend.emails.send({
            from: "GoEvent <onboarding@resend.dev>",
            to: [authUser.user.email],
            subject: `Reminder: ${event.title} is Tomorrow!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Event Reminder</h1>
                <p>Dear ${attendee.profiles.full_name},</p>
                <p>This is a friendly reminder that you're registered for the following event happening <strong>tomorrow</strong>:</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #6366f1; margin-top: 0;">${event.title}</h2>
                  <p><strong>📅 Date:</strong> ${formattedDate}</p>
                  <p><strong>🕒 Time:</strong> ${formattedTime}</p>
                  <p><strong>📍 Venue:</strong> ${event.location}</p>
                  <p><strong>🎫 Tickets:</strong> ${attendee.tickets_count}</p>
                </div>

                <p>We're excited to see you there! If you have any questions, please don't hesitate to reach out.</p>
                
                <p style="margin-top: 30px;">Best regards,<br>The GoEvent Team</p>
              </div>
            `,
          });

          console.log(`Email sent to ${authUser.user.email}:`, emailResponse);
          emailsSent++;
        } catch (error) {
          console.error(`Failed to send email to user ${attendee.user_id}:`, error);
          emailsFailed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Daily reminders sent successfully",
        stats: {
          eventsProcessed: events.length,
          emailsSent,
          emailsFailed,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-daily-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);