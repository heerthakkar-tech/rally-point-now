import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, DollarSign, Plus, Settings, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Session } from "@supabase/supabase-js";

interface Profile {
  full_name: string;
  is_organizer: boolean;
  user_roles?: Array<{ role: string }>;
}

interface Event {
  id: string;
  title: string;
  location: string;
  start_date: string;
  ticket_price: number;
  status: string;
  event_categories?: {
    name: string;
  };
}

interface RegisteredEvent extends Event {
  event_attendees: Array<{
    tickets_count: number;
    registered_at: string;
  }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchRegisteredEvents();
      fetchMyEvents();
    }
  }, [session]);

  const fetchProfile = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, is_organizer")
      .eq("id", session.user.id)
      .single();

    if (error) {
      toast.error("Failed to load profile");
    } else {
      // Check if user is admin by email
      const adminEmails = ["heerthakkar223@gmail.com", "omkarsinh.04@gmail.com"];
      const isAdminByEmail = session.user.email && adminEmails.includes(session.user.email);

      // Check if user has organizer or admin role
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["event_manager", "admin"]);
      
      const hasOrganizerRole = isAdminByEmail || (rolesData && rolesData.length > 0) || data?.is_organizer;
      setProfile({ ...data, is_organizer: hasOrganizerRole });
    }
  };

  const fetchRegisteredEvents = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        event_categories(name),
        event_attendees!inner(tickets_count, registered_at)
      `)
      .eq("event_attendees.user_id", session.user.id)
      .order("start_date", { ascending: true });

    if (error) {
      toast.error("Failed to load registered events");
    } else {
      setRegisteredEvents(data || []);
    }
    setLoading(false);
  };

  const fetchMyEvents = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("events")
      .select("*, event_categories(name)")
      .eq("organizer_id", session.user.id)
      .order("start_date", { ascending: true });

    if (error) {
      toast.error("Failed to load your events");
    } else {
      setMyEvents(data || []);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!session) return;

    const { error } = await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", session.user.id);

    if (error) {
      toast.error("Failed to cancel registration");
    } else {
      toast.success("Registration cancelled");
      fetchRegisteredEvents();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      toast.error("Failed to delete event");
    } else {
      toast.success("Event deleted successfully");
      fetchMyEvents();
    }
  };

  const handleBecomeOrganizer = async () => {
    if (!session) return;

    try {
      // Check if user already has event_manager or admin role
      const { data: existingRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["event_manager", "admin"]);

      if (existingRoles && existingRoles.length > 0) {
        // Update profile to mark as organizer
        await supabase
          .from("profiles")
          .update({ is_organizer: true })
          .eq("id", session.user.id);
        
        toast.info("You're already an organizer!");
        fetchProfile();
        return;
      }

      // Add event_manager role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: session.user.id, 
          role: "event_manager" 
        });

      if (roleError) {
        if (roleError.code === "23505") {
          toast.info("You're already an organizer!");
        } else {
          console.error("Role error:", roleError);
          toast.error("Failed to become an organizer. Please contact support.");
        }
        return;
      }

      // Update profile to mark as organizer
      await supabase
        .from("profiles")
        .update({ is_organizer: true })
        .eq("id", session.user.id);

      toast.success("You're now an organizer!");
      fetchProfile();
    } catch (err) {
      console.error("Error becoming organizer:", err);
      toast.error("An error occurred. Please try again.");
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8 shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl gradient-hero text-white">
                    {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold mb-1">{profile?.full_name || "User"}</h1>
                  <p className="text-muted-foreground">{session.user.email}</p>
                  {profile?.is_organizer && (
                    <Badge variant="secondary" className="mt-2">
                      Event Organizer
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="registered" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registered">My Registrations</TabsTrigger>
            <TabsTrigger value="myevents">My Events</TabsTrigger>
          </TabsList>

          <TabsContent value="registered" className="space-y-4">
            {registeredEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You haven't registered for any events yet
                  </p>
                  <Link to="/events">
                    <Button>Explore Events</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              registeredEvents.map((event) => (
                <Card key={event.id} className="shadow-card hover:shadow-hover transition-smooth">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{event.title}</h3>
                          {event.event_categories && (
                            <Badge variant="secondary">{event.event_categories.name}</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.start_date), "MMM dd, yyyy • h:mm a")}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                          {event.event_attendees[0] && (
                            <p className="font-semibold text-foreground">
                              Tickets: {event.event_attendees[0].tickets_count}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/events/${event.id}`}>
                            <Button variant="default" size="sm">
                              View Event
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelRegistration(event.id)}
                          >
                            Cancel Registration
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="myevents" className="space-y-4">
            {!profile?.is_organizer ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Become an organizer to create and manage events
                  </p>
                  <Button onClick={handleBecomeOrganizer}>Become an Organizer</Button>
                </CardContent>
              </Card>
            ) : myEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You haven't created any events yet
                  </p>
                  <Link to="/create-event">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Event
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <Link to="/create-event">
                    <Button variant="secondary" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Event
                    </Button>
                  </Link>
                </div>
                {myEvents.map((event) => (
                  <Card key={event.id} className="shadow-card hover:shadow-hover transition-smooth">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{event.title}</h3>
                            {event.event_categories && (
                              <Badge variant="secondary">{event.event_categories.name}</Badge>
                            )}
                            <Badge
                              variant={
                                event.status === "upcoming"
                                  ? "default"
                                  : event.status === "ongoing"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {event.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(event.start_date), "MMM dd, yyyy • h:mm a")}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                            {event.ticket_price > 0 && (
                              <div className="flex items-center gap-2">
                                <span>₹{event.ticket_price}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/events/${event.id}`}>
                              <Button variant="default" size="sm">
                                View Event
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
