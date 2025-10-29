import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully!");
      
      // Auto-assign admin role for specific emails on login if not already assigned
      if (data.user && (email === "heerthakkar223@gmail.com" || email === "omkarsinh.04@gmail.com")) {
        // Use a slight delay to ensure profile is created first
        setTimeout(async () => {
          try {
            // Check for existing admin role
            const { data: existingRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", data.user.id)
              .eq("role", "admin")
              .maybeSingle();
            
            if (!existingRole) {
              // Insert admin role
              const { error: roleError } = await supabase
                .from("user_roles")
                .insert({ user_id: data.user.id, role: "admin" });
              
              if (roleError && roleError.code !== "23505") {
                console.error("Failed to assign admin role:", roleError);
              }
            }

            // Also update profile to mark as organizer
            await supabase
              .from("profiles")
              .update({ is_organizer: true })
              .eq("id", data.user.id);
          } catch (err) {
            console.error("Error setting up admin user:", err);
          }
        }, 500);
      }
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created successfully! Please check your email for a welcome message!");
      
      // Auto-assign admin role for specific emails (in addition to default participant role)
      if (data.user && (email === "heerthakkar223@gmail.com" || email === "omkarsinh.04@gmail.com")) {
        setTimeout(async () => {
          try {
            // Insert admin role
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({ user_id: data.user.id, role: "admin" });
            
            if (roleError && roleError.code !== "23505") {
              console.error("Failed to assign admin role:", roleError);
            }

            // Update profile to mark as organizer
            await supabase
              .from("profiles")
              .update({ is_organizer: true })
              .eq("id", data.user.id);
          } catch (err) {
            console.error("Error setting up admin user:", err);
          }
        }, 500);
      }
      
      // Send welcome email
      if (data.user) {
        setTimeout(async () => {
          try {
            const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
              body: {
                email,
                name: fullName,
              },
            });
            
            if (emailError) {
              console.error('Failed to send welcome email:', emailError);
            }
          } catch (err) {
            console.error('Failed to send welcome email:', err);
          }
        }, 100);
      }
    }
    setLoading(false);
  };

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-hover">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full gradient-hero">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to GoEvent</CardTitle>
          <CardDescription>Sign in or create an account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
