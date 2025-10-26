import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { Session } from "@supabase/supabase-js";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    location: "",
    start_date: "",
    end_date: "",
    ticket_price: "0",
    total_tickets: "",
    image_url: "",
  });

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
      checkOrganizerStatus();
      fetchCategories();
    }
  }, [session]);

  const checkOrganizerStatus = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("is_organizer")
      .eq("id", session.user.id)
      .single();

    if (error) {
      toast.error("Failed to verify organizer status");
      navigate("/dashboard");
    } else if (!data.is_organizer) {
      toast.error("You need to be an organizer to create events");
      navigate("/dashboard");
    } else {
      setIsOrganizer(true);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("event_categories")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !isOrganizer) {
      toast.error("You must be an organizer to create events");
      return;
    }

    if (!formData.title || !formData.description || !formData.location || !formData.start_date || !formData.end_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);

    const eventData = {
      title: formData.title,
      description: formData.description,
      category_id: formData.category_id || null,
      location: formData.location,
      start_date: formData.start_date,
      end_date: formData.end_date,
      ticket_price: parseFloat(formData.ticket_price) || 0,
      total_tickets: formData.total_tickets ? parseInt(formData.total_tickets) : null,
      available_tickets: formData.total_tickets ? parseInt(formData.total_tickets) : null,
      image_url: formData.image_url || null,
      organizer_id: session.user.id,
      status: "upcoming",
    };

    const { data, error } = await supabase.from("events").insert(eventData).select().single();

    if (error) {
      toast.error("Failed to create event");
      console.error(error);
    } else {
      toast.success("Event created successfully!");
      navigate(`/events/${data.id}`);
    }

    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!session || !isOrganizer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl">
        <Card className="shadow-hover">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg gradient-hero">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl">Create New Event</CardTitle>
                <CardDescription>Fill in the details to create your event</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Amazing Summer Festival"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your event in detail..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="City, State or Address"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date & Time *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time *</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket_price">Ticket Price (USD)</Label>
                  <Input
                    id="ticket_price"
                    name="ticket_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.ticket_price}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">Leave as 0 for free events</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_tickets">Total Tickets Available</Label>
                  <Input
                    id="total_tickets"
                    name="total_tickets"
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={formData.total_tickets}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Event Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a URL to an event image (optional)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating Event..." : "Create Event"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
