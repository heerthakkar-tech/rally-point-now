import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Users } from "lucide-react";
import EventCard from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroBanner from "@/assets/hero-banner.jpg";

interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  location: string;
  start_date: string;
  ticket_price: number;
  event_categories?: {
    name: string;
    slug: string;
  };
}

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data: featured, error: featuredError } = await supabase
      .from("events")
      .select("*, event_categories(name, slug)")
      .eq("is_featured", true)
      .eq("status", "upcoming")
      .order("start_date", { ascending: true })
      .limit(3);

    if (featuredError) {
      toast.error("Failed to load featured events");
    } else {
      setFeaturedEvents(featured || []);
    }

    const { data: upcoming, error: upcomingError } = await supabase
      .from("events")
      .select("*, event_categories(name, slug)")
      .eq("status", "upcoming")
      .order("start_date", { ascending: true })
      .limit(6);

    if (upcomingError) {
      toast.error("Failed to load upcoming events");
    } else {
      setUpcomingEvents(upcoming || []);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/events?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBanner}
            alt="Event Hero"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        </div>
        <div className="container relative h-full flex flex-col justify-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 max-w-2xl">
            Discover Amazing Events Near You
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-xl text-white/90">
            Connect with experiences that matter. Find and join events that inspire you.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events, categories, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg bg-white text-foreground placeholder:text-muted-foreground"
            />
          </div>
            <Button type="submit" variant="hero" size="lg" className="h-12 px-8">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-hero mb-4">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Diverse Events</h3>
              <p className="text-muted-foreground">
                From music and sports to technology and culture - find events that match your interests
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-hero mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local & Global</h3>
              <p className="text-muted-foreground">
                Discover events happening in your neighborhood or explore experiences worldwide
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-hero mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Registration</h3>
              <p className="text-muted-foreground">
                Book tickets instantly and manage all your event registrations in one place
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Events</h2>
                <p className="text-muted-foreground">
                  Don't miss these specially curated experiences
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description}
                  image_url={event.image_url}
                  location={event.location}
                  start_date={event.start_date}
                  ticket_price={event.ticket_price}
                  category={event.event_categories}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
                <p className="text-muted-foreground">
                  Browse events happening soon
                </p>
              </div>
              <Link to="/events">
                <Button variant="default">View All Events</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description}
                  image_url={event.image_url}
                  location={event.location}
                  start_date={event.start_date}
                  ticket_price={event.ticket_price}
                  category={event.event_categories}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Create Your Own Event?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of organizers who trust GoEvent to bring their events to life
          </p>
          <Link to="/auth">
            <Button variant="secondary" size="lg" className="h-12 px-8">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
