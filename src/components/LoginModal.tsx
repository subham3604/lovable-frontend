import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { api, setAuthToken, setUserInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function LoginModal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.login({ username: email, password });
      setAuthToken(response.token);
      if (response.user) {
        setUserInfo(response.user);
      }
      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
      navigate("/projects");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="relative w-full max-w-[420px] z-10">
        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5 glow-effect">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-white mb-2">Welcome to Genesis</h1>
            <p className="text-muted-foreground/60 text-sm">Sign in to continue building</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-background border-border focus-visible:ring-ring rounded-lg text-sm"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-background border-border focus-visible:ring-ring rounded-lg text-sm"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground/60 mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:text-primary/90 font-medium underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
