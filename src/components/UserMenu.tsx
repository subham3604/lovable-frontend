import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Loader2, User, CreditCard, LogOut } from "lucide-react";
import { api, removeAuthToken, removeUserInfo, getUserInfo } from "@/lib/api";
import { UserProfileResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export const UserMenu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = getUserInfo();
        if (storedUser) {
          setUser(storedUser as UserProfileResponse);
          return;
        }

        const profileData = await api.getProfile();
        setUser(profileData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    removeUserInfo();
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
    navigate("/login");
  };

  if (loading || !user) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  const initials = user.name && user.name.trim()
    ? user.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (user.username ? user.username[0].toUpperCase() : "U");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="w-8 h-8 bg-primary/20">
            <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground">{user.name || user.username}</p>
          <p className="text-xs text-muted-foreground truncate">{user.username}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/billing")} className="cursor-pointer">
          <CreditCard className="w-4 h-4 mr-2" />
          Billing & Subscription
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
