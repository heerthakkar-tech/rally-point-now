import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, DollarSign, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Session } from "@supabase/supabase-js";

interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  start_date: string;
  end_date: string;
  ticket_price: number;
  total_tickets?: number;
  available_tickets?: number;
  status: string;
  event_categories?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchEvent();
      if (session) {
        checkRegistration();
      }
    }
  }, [id, session]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*, event_categories(name), profiles(full_name)")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load event");
      navigate("/events");
    } else {
      setEvent(data);
    }
    setLoading(false);
  };

  const checkRegistration = async () => {
    if (!session || !id) return;

    const { data } = await supabase
      .from("event_attendees")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    setIsRegistered(!!data);
  };

  const handleRegister = async () => {
    if (!session) {
      toast.error("Please sign in to register for events");
      navigate("/auth");
      return;
    }

    if (!event) return;

    if (event.available_tickets !== null && event.available_tickets !== undefined && ticketCount > event.available_tickets) {
      toast.error("Not enough tickets available");
      return;
    }

    setRegistering(true);

    const { error } = await supabase.from("event_attendees").insert({
      event_id: event.id,
      user_id: session.user.id,
      tickets_count: ticketCount,
      total_paid: event.ticket_price * ticketCount,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You're already registered for this event");
      } else {
        toast.error("Failed to register for event");
      }
    } else {
      toast.success("Successfully registered for event!");
      setIsRegistered(true);
      fetchEvent();
    }
    setRegistering(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-6xl">
        {/* Event Image */}
        <div className="aspect-video w-full rounded-lg overflow-hidden mb-8 shadow-card">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center gradient-card">
              <Calendar className="h-32 w-32 text-muted-foreground/20" />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              {event.event_categories && (
                <Badge variant="secondary" className="mb-3">
                  {event.event_categories.name}
                </Badge>
              )}
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
              {event.profiles && (
                <p className="text-muted-foreground">
                  Organized by <span className="font-semibold">{event.profiles.full_name}</span>
                </p>
              )}
            </div>

            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </CardContent>
            </Card>

            {/* Map placeholder */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{event.location}</p>
                </div>
                <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Map view (Integration pending)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24 shadow-hover">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Start Date</p>
                      <p className="text-muted-foreground">
                        {format(new Date(event.start_date), "MMM dd, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">End Date</p>
                      <p className="text-muted-foreground">
                        {format(new Date(event.end_date), "MMM dd, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>
                  {event.ticket_price > 0 ? (
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-semibold">Price per Ticket</p>
                        <p className="text-accent font-bold text-lg">${event.ticket_price}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-semibold text-accent">Free Event</p>
                      </div>
                    </div>
                  )}
                  {event.available_tickets !== null && event.available_tickets !== undefined && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Available Tickets</p>
                        <p className="text-muted-foreground">{event.available_tickets} remaining</p>
                      </div>
                    </div>
                  )}
                </div>

                {!isRegistered ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="tickets">Number of Tickets</Label>
                      <Input
                        id="tickets"
                        type="number"
                        min="1"
                        max={event.available_tickets || 10}
                        value={ticketCount}
                        onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    {event.ticket_price > 0 && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-accent">
                          ${(event.ticket_price * ticketCount).toFixed(2)}
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={handleRegister}
                      disabled={registering || event.status !== "upcoming"}
                      className="w-full"
                      size="lg"
                    >
                      {registering ? "Registering..." : "Register for Event"}
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-primary font-semibold">You're registered for this event!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
