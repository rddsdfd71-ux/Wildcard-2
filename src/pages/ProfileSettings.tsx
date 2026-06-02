import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, LogOut, Crown } from "lucide-react";
import { userSessionManager } from "@/lib/userSession";
import { getAuthUser, clearAuthUser } from "@/lib/auth";
import { useLocation } from "wouter";

interface UserProfile {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  currentRank: number;
  isPremium: boolean;
}

export default function ProfileSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [, navigate] = useLocation();
  const authUser = getAuthUser();
  const currentUserId = userSessionManager.getNumericUserId();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${currentUserId}/profile`],
    retry: false,
  });

  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    email: "",
  });

  useState(() => {
    if (profile) {
      setFormData({ fullName: profile.fullName || "", email: profile.email || "" });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName?: string; email?: string }) => {
      return await apiRequest("PUT", `/api/users/${currentUserId}/profile`, {
        displayName: data.fullName,
        email: data.email,
      });
    },
    onSuccess: () => {
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully!" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/profile`] });
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message || "Failed to update profile", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast({ title: "Validation Error", description: "Display name cannot be empty", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({ fullName: formData.fullName.trim(), email: formData.email.trim() || undefined });
  };

  const handleLogout = () => {
    clearAuthUser();
    queryClient.clear();
    window.location.href = "/auth";
  };

  const displayName = profile?.fullName || authUser?.fullName || authUser?.username || "Wild Card Player";
  const username = profile?.username || authUser?.username || "player";

  return (
    <section className="tab-content animate-in slide-in-from-left duration-300">
      <div className="mb-6">
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">
          Profile
        </h2>
      </div>

      {/* Profile Hero */}
      <Card className="bg-[#000000] border-[#2A2A2A] p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-[#FF6B00] rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-['Oswald'] text-xl text-white">{displayName}</h2>
            <p className="text-gray-400 text-sm">@{username}</p>
            <div className="flex items-center gap-2 mt-1">
              {profile?.isPremium || authUser?.isPremium ? (
                <span className="flex items-center gap-1 text-xs bg-[#FF6B00]/20 text-[#FF6B00] px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              ) : (
                <span className="text-xs text-gray-500">Free Plan</span>
              )}
              <span className="text-xs text-gray-500">Rank #{profile?.currentRank || "—"}</span>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Display Name</span>
              <span className="text-white">{profile?.fullName || "Not set"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Username</span>
              <span className="text-gray-300">@{username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{profile?.email || "Not set"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Member Since</span>
              <span className="text-gray-300">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "—"}
              </span>
            </div>
            <Button onClick={() => setIsEditing(true)} className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white mt-2">
              Edit Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-gray-300">Display Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white mt-1"
                placeholder="Your display name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-[#2A2A2A] border-[#3A3A3A] text-white mt-1"
                placeholder="Email (optional)"
              />
            </div>
            <div className="text-sm text-gray-500">@{username} — username cannot be changed</div>
            <div className="flex gap-3">
              <Button type="submit" disabled={updateProfileMutation.isPending} className="flex-1 bg-[#FF6B00] hover:bg-orange-600 text-white">
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1 border-[#3A3A3A] text-white hover:bg-[#2A2A2A]">
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Account Actions */}
      <Card className="bg-[#000000] border-[#2A2A2A] p-6 mb-4">
        <h3 className="font-['Oswald'] text-lg text-[#FF6B00] mb-4">Account</h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Your account is linked to this device. Sign in on any device with your username and password to access your data.
          </p>
          <div className="bg-[#1A1A1A] rounded-lg p-3 text-sm">
            <div className="text-gray-400 mb-1">Signed in as</div>
            <div className="text-white font-bold">@{username}</div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Premium upsell if not premium */}
      {!profile?.isPremium && !authUser?.isPremium && (
        <Card className="bg-[#000000] border-[#FF6B00]/40 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-['Oswald'] text-lg text-[#FF6B00]">Upgrade to Premium</h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">Unlock AI Video Analysis, Market Value, and Position Analysis from £4.99/month.</p>
          <Button onClick={() => navigate("/subscription")} className="w-full bg-[#FF6B00] hover:bg-orange-600 text-black font-bold">
            View Plans
          </Button>
        </Card>
      )}
    </section>
  );
}
