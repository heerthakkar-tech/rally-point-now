import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-4xl">
        <Card className="shadow-hover">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full gradient-hero">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">About Us</h1>
            <p className="text-xl text-muted-foreground">GoEvent</p>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none px-8 pb-8">
            <p className="text-lg leading-relaxed mb-6">
              GoEvent is a modern web-based platform designed to help people discover, explore, and participate in events happening around them or across the globe.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              Our mission is to connect event organizers and attendees through a simple, efficient, and user-friendly interface. Whether it's a concert, webinar, cultural fest, or meetup, GoEvent helps you find your next great experience.
            </p>
            
            <p className="text-lg leading-relaxed mb-8">
              Built with a full-stack architecture, GoEvent offers smooth navigation, category-based event browsing, map integration, and secure authentication for organizers and users alike.
            </p>

            <div className="mt-12 pt-8 border-t border-border text-center">
              <p className="text-muted-foreground">
                <strong>© 2025 GoEvent — All Rights Reserved.</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
