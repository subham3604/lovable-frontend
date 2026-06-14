import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, LogOut } from "lucide-react";
import { api, isAuthenticated, removeAuthToken, removeUserInfo, getUserInfo } from "@/lib/api";
import { UserProfileResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await api.getProfile();
        setProfile(profileData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  const handleLogout = () => {
    removeAuthToken();
    removeUserInfo();
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Button onClick={() => navigate("/login")} className="bg-primary hover:bg-primary/90 rounded-xl">
          Go to Login
        </Button>
      </div>
    );
  }

  const initials = profile.name && profile.name.trim()
    ? profile.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (profile.username ? profile.username[0].toUpperCase() : "U");

  return (
    <div className="min-h-screen bg-background py-16 px-6 relative overflow-hidden">
      <div className="max-w-2xl mx-auto relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-10 tracking-tight font-display bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">User Profile</h1>

        <Card className="bg-white/[0.02] border-white/5 rounded-2xl backdrop-blur-md p-2">
          <CardHeader>
            <CardTitle className="text-white font-display text-lg font-bold">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-xl border border-white/5">
              <Avatar className="w-16 h-16 bg-primary/10 border-2 border-primary/30">
                <AvatarFallback className="text-primary font-bold text-lg font-display">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-bold text-white font-display">{profile.name || profile.username}</p>
                <p className="text-muted-foreground/60 text-sm">{profile.username}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <div className="space-y-5">
                <div>
                  <p className="text-muted-foreground/50 text-xs font-semibold uppercase tracking-wider mb-1">Full Name</p>
                  <p className="text-white text-sm font-medium">{profile.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/50 text-xs font-semibold uppercase tracking-wider mb-1">Email / Username</p>
                  <p className="text-white text-sm font-medium">{profile.username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/50 text-xs font-semibold uppercase tracking-wider mb-1">User ID</p>
                  <p className="text-white font-mono text-xs font-medium bg-white/5 inline-block px-2.5 py-1 rounded-md border border-white/5">{profile.id}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-3">
              <Button
                onClick={() => navigate("/billing")}
                variant="outline"
                className="w-full h-11 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 hover:text-white"
              >
                View Billing & Subscription
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full h-11 rounded-xl bg-destructive hover:bg-destructive/90"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-10">
          <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 hover:text-white px-6 h-10" onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    </div>
  );
};
