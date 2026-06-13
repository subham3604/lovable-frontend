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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Button onClick={() => navigate("/login")} variant="default">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">User Profile</h1>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 bg-primary/20 border-2 border-primary">
                <AvatarFallback className="text-white font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-bold text-white">{profile.name || profile.username}</p>
                <p className="text-slate-400">{profile.username}</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Full Name</p>
                  <p className="text-white">{profile.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Email / Username</p>
                  <p className="text-white">{profile.username}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">User ID</p>
                  <p className="text-white font-mono">{profile.id}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6 space-y-4">
              <Button
                onClick={() => navigate("/billing")}
                variant="outline"
                className="w-full"
              >
                View Billing & Subscription
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Button variant="outline" onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    </div>
  );
};
