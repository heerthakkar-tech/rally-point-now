import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  location: string;
  start_date: string;
  ticket_price: number;
  category?: {
    name: string;
    slug: string;
  };
}

const EventCard = ({
  id,
  title,
  description,
  image_url,
  location,
  start_date,
  ticket_price,
  category,
}: EventCardProps) => {
  return (
    <Card className="group overflow-hidden shadow-card hover:shadow-hover transition-smooth">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-smooth"
          />
        ) : (
          <div className="flex h-full items-center justify-center gradient-card">
            <Calendar className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          {category && (
            <Badge variant="secondary" className="shrink-0">
              {category.name}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(start_date), "MMM dd, yyyy • h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{location}</span>
          </div>
          {ticket_price > 0 && (
            <div className="flex items-center gap-2 text-accent font-semibold">
              <DollarSign className="h-4 w-4" />
              <span>${ticket_price}</span>
            </div>
          )}
          {ticket_price === 0 && (
            <div className="flex items-center gap-2 text-accent font-semibold">
              <span>Free Event</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/events/${id}`} className="w-full">
          <Button variant="default" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
