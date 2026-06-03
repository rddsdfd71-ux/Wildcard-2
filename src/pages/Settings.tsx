import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  User, LogOut, Zap, TrendingUp, Target,
  ChevronDown, ChevronUp, Shield, FileText, Users,
} from "lucide-react";
import { userSessionManager } from "@/lib/userSession";
import { getAuthUser, clearAuthUser } from "@/lib/auth";

function Section({
  id, icon: Icon, title, subtitle, defaultOpen = false, children,
}: {
  id: string; icon: React.ElementType; title: string; subtitle?: string;
  defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="bg-[#000000] border-[#2A2A2A] overflow-hidden mb-4">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-5 text-left">
        <div className="w-9 h-9 bg-[#FF6B00]/15 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#FF6B00]" />
        </div>
        <div className="flex-1">
          <div className="font-['Oswald'] text-white text-base font-bold">{title}</div>
          {subtitle && <div className="text-gray-500 text-xs">{subtitle}</div>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-[#1A1A1A] pt-4">{children}</div>}
    </Card>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const authUser = getAuthUser();
  const currentUserId = userSessionManager.getNumericUserId();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: authUser?.fullName || "", email: "" });

  const { data: profile } = useQuery<any>({
    queryKey: [`/api/users/${currentUserId}/profile`],
    retry: false,
  });

  const { data: aiUsage } = useQuery<{
    valuation: { used: number; limit: number };
    positionAnalysis: { used: number; limit: number };
  }>({
    queryKey: [`/api/users/${currentUserId}/ai-usage`],
    retry: false,
  });

  useEffect(() => {
    if (profile) setFormData({ fullName: profile.fullName || "", email: profile.email || "" });
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName?: string; email?: string }) =>
      apiRequest("PUT", `/api/users/${currentUserId}/profile`, { displayName: data.fullName, email: data.email }),
    onSuccess: () => {
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully!" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/profile`] });
    },
    onError: (error: any) =>
      toast({ title: "Update Failed", description: error.message || "Failed to update profile", variant: "destructive" }),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
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
    import("@/lib/analytics").then(({ resetAnalytics }) => resetAnalytics());
    window.location.href = "/";
  };

  const displayName = profile?.fullName || authUser?.fullName || authUser?.username || "Wild Card Player";
  const username = profile?.username || authUser?.username || "player";

  return (
    <section className="tab-content animate-in slide-in-from-left duration-300">
      <div className="mb-6">
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-1 border-l-4 border-[#FF6B00] pl-3">Settings</h2>
        <p className="text-gray-400 text-sm pl-4">Manage your account and preferences</p>
      </div>

      {/* Profile summary */}
      <div className="flex items-center gap-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 mb-5">
        <div className="w-14 h-14 bg-[#FF6B00] rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-['Oswald'] text-lg text-white truncate">{displayName}</div>
          <div className="text-gray-400 text-sm">@{username}</div>
          {profile?.country && <div className="text-xs text-gray-500 mt-0.5">🌍 {profile.country}</div>}
          <div className="mt-1">
            <span className="text-xs text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full font-bold">WILD CARD</span>
          </div>
        </div>
      </div>

      {/* 1. Profile */}
      <Section id="profile" icon={User} title="Profile" subtitle="Edit your display name and email" defaultOpen>
        {!isEditing ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
              <span className="text-gray-400 text-sm">Display Name</span>
              <span className="text-white text-sm font-medium">{profile?.fullName || "Not set"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
              <span className="text-gray-400 text-sm">Username</span>
              <span className="text-gray-300 text-sm">@{username}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
              <span className="text-gray-400 text-sm">Email</span>
              <span className="text-white text-sm">{profile?.email || "Not set"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
              <span className="text-gray-400 text-sm">Country</span>
              <span className="text-white text-sm">{profile?.country || "Not set"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
              <span className="text-gray-400 text-sm">Member Since</span>
              <span className="text-gray-300 text-sm">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "—"}
              </span>
            </div>
            <Button onClick={() => setIsEditing(true)} className="w-full bg-[#FF6B00] hover:bg-orange-600 text-black font-bold mt-2">
              Edit Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-gray-300 text-sm">Display Name</Label>
              <Input id="fullName" value={formData.fullName}
                onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                className="bg-[#1A1A1A] border-[#3A3A3A] text-white mt-1" placeholder="Your display name" required />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
              <Input id="email" type="email" value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                className="bg-[#1A1A1A] border-[#3A3A3A] text-white mt-1" placeholder="Email (optional)" />
            </div>
            <p className="text-xs text-gray-500">Username @{username} cannot be changed</p>
            <div className="flex gap-3">
              <Button type="submit" disabled={updateProfileMutation.isPending}
                className="flex-1 bg-[#FF6B00] hover:bg-orange-600 text-black font-bold">
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}
                className="flex-1 border-[#3A3A3A] text-white hover:bg-[#1A1A1A]">
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Section>

      {/* 2. Discord Community — always visible */}
      <Card className="bg-[#0A0A0A] border-[#2A2A2A] p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-[#5865F2]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-[#5865F2]" />
          </div>
          <div>
            <div className="font-['Oswald'] text-white text-base font-bold">Wild Card Community</div>
            <div className="text-gray-500 text-xs">Share progress, give feedback, meet players</div>
          </div>
        </div>
        <a
          href="https://discord.gg/p8CmbBGyT"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-['Oswald'] font-bold py-3 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Join Discord Server
        </a>
      </Card>

      {/* 3. AI Usage */}
      <Section id="ai-usage" icon={Zap} title="AI Features" subtitle="Free uses included with your account">
        <div className="space-y-3">
          {[
            { icon: TrendingUp, label: "Market Valuation", key: "valuation" as const },
            { icon: Target, label: "Position Analysis", key: "positionAnalysis" as const },
          ].map(({ icon: Icon, label, key }) => {
            const u = aiUsage?.[key];
            const used = u?.used ?? 0;
            const limit = u?.limit ?? 0;
            const pct = limit > 0 ? (used / limit) * 100 : 0;
            return (
              <div key={key} className="bg-[#0A0A0A] rounded-lg p-3 border border-[#1A1A1A]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#FF6B00]" />
                    <span className="text-gray-300 text-sm">{label}</span>
                  </div>
                  <span className={`text-sm font-bold ${used >= limit ? "text-gray-500" : "text-[#FF6B00]"}`}>
                    {used}/{limit}
                  </span>
                </div>
                <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${used >= limit ? "bg-gray-600" : "bg-[#FF6B00]"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-gray-500 text-xs pt-1">All AI features are completely free — no subscriptions needed.</p>
        </div>
      </Section>

      {/* 4. Privacy Policy */}
      <Section id="privacy" icon={Shield} title="Privacy Policy" subtitle="How we handle your data">
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">1. Information We Collect</h4>
            <p>Wild Card collects information you provide directly, including your username, password (stored as a secure hash), display name, country, and email address (optional). We also collect training activity data such as workout sessions, skill progression, and performance statistics.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">2. How We Use Your Information</h4>
            <p>Your data is used exclusively to provide and improve the Wild Card service. This includes displaying your progress, calculating your rank on the leaderboard, and personalising your training experience. We do not sell your data to third parties.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">3. Data Storage & Security</h4>
            <p>All data is stored securely on encrypted servers. Passwords are never stored in plain text — they are hashed using SHA-256 before being saved.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">4. Your Rights</h4>
            <p>You may request deletion of your account and all associated data at any time. Contact us at <span className="text-[#FF6B00]">support@wildcardfc.app</span>.</p>
          </div>
          <p className="text-gray-500 text-xs border-t border-[#1A1A1A] pt-3">Last updated: June 2026</p>
        </div>
      </Section>

      {/* 5. Terms of Use */}
      <Section id="terms" icon={FileText} title="Terms of Use" subtitle="Rules for using Wild Card">
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">1. Acceptance of Terms</h4>
            <p>By creating an account and using Wild Card, you agree to these Terms of Use.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">2. Use of the Service</h4>
            <p>Wild Card is a personal football training application. You agree to use it only for lawful purposes.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">3. Health & Safety Disclaimer</h4>
            <p>Wild Card provides fitness guidance for informational purposes only. Always consult a qualified healthcare professional before starting a new training programme.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">4. Intellectual Property</h4>
            <p>All content, branding, and code within Wild Card is the intellectual property of Wild Card and its licensors.</p>
          </div>
          <p className="text-gray-500 text-xs border-t border-[#1A1A1A] pt-3">Last updated: June 2026</p>
        </div>
      </Section>

      {/* Account actions */}
      <Card className="bg-[#000000] border-[#2A2A2A] p-5 mt-2">
        <h3 className="font-['Oswald'] text-[#FF6B00] font-bold text-base mb-3">Account</h3>
        <div className="bg-[#0A0A0A] rounded-lg p-3 text-sm mb-3">
          <div className="text-gray-400 text-xs mb-1">Signed in as</div>
          <div className="text-white font-bold">@{username}</div>
        </div>
        <p className="text-xs text-gray-500 mb-4">Sign in on any device with your username and password to access your data.</p>
        <Button onClick={handleLogout} variant="outline"
          className="w-full border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </Card>
    </section>
  );
}
