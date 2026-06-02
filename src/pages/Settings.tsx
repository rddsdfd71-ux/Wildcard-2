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
  ChevronDown, ChevronUp, Shield, FileText,
} from "lucide-react";
import { userSessionManager } from "@/lib/userSession";
import { getAuthUser, clearAuthUser } from "@/lib/auth";

// ─── Collapsible section wrapper ────────────────────────────────────────────
function Section({
  id, icon: Icon, title, subtitle, defaultOpen = false, children,
}: {
  id: string; icon: React.ElementType; title: string; subtitle?: string;
  defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="bg-[#000000] border-[#2A2A2A] overflow-hidden mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-5 text-left"
      >
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

// ─── Main Settings page ──────────────────────────────────────────────────────
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
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-1 border-l-4 border-[#FF6B00] pl-3">
          Settings
        </h2>
        <p className="text-gray-400 text-sm pl-4">Manage your account and preferences</p>
      </div>

      {/* ── Profile summary card (always visible) ── */}
      <div className="flex items-center gap-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 mb-5">
        <div className="w-14 h-14 bg-[#FF6B00] rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-['Oswald'] text-lg text-white truncate">{displayName}</div>
          <div className="text-gray-400 text-sm">@{username}</div>
          <div className="mt-1">
            <span className="text-xs text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full font-bold">WILD CARD</span>
          </div>
        </div>
      </div>

      {/* ── 1. Profile ── */}
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

      {/* ── 2. AI Usage ── */}
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
                  <div
                    className={`h-full rounded-full transition-all ${used >= limit ? "bg-gray-600" : "bg-[#FF6B00]"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-gray-500 text-xs pt-1">
            All AI features are completely free — no subscriptions needed.
          </p>
        </div>
      </Section>


      {/* ── 3. Privacy Policy ── */}
      <Section id="privacy" icon={Shield} title="Privacy Policy" subtitle="How we handle your data">
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">1. Information We Collect</h4>
            <p>Wild Card collects information you provide directly, including your username, password (stored as a secure hash), display name, and email address (optional). We also collect training activity data such as workout sessions, skill progression, and performance statistics that you generate while using the app.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">2. How We Use Your Information</h4>
            <p>Your data is used exclusively to provide and improve the Wild Card service. This includes displaying your progress, calculating your rank on the leaderboard, generating AI-powered insights (for premium users), and personalising your training experience. We do not sell your data to third parties.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">3. Data Storage & Security</h4>
            <p>All data is stored securely on encrypted servers. Passwords are never stored in plain text — they are hashed using SHA-256 before being saved. Payment processing is handled entirely by Polar, and Wild Card never stores or has access to your payment card details.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">4. Video Analysis Data</h4>
            <p>When you use the AI Video Analysis feature (Premium), uploaded video content is processed by our AI service and then discarded. We do not permanently store your uploaded video files. Only the generated feedback and analysis text is retained in your account.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">5. Your Rights</h4>
            <p>You may request deletion of your account and all associated data at any time by contacting us. You can update your profile information at any time within the app. You have the right to request a copy of the personal data we hold about you.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">6. Contact</h4>
            <p>For any privacy-related queries, please contact us at <span className="text-[#FF6B00]">support@wildcardfc.app</span>. We will respond within 5 working days.</p>
          </div>
          <p className="text-gray-500 text-xs border-t border-[#1A1A1A] pt-3">Last updated: May 2026</p>
        </div>
      </Section>

      {/* ── 4. Terms of Use ── */}
      <Section id="terms" icon={FileText} title="Terms of Use" subtitle="Rules for using Wild Card">
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">1. Acceptance of Terms</h4>
            <p>By creating an account and using Wild Card, you agree to these Terms of Use. If you do not agree, please do not use the app. These terms apply to all users, including free and premium subscribers.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">2. Use of the Service</h4>
            <p>Wild Card is a personal football training application. You agree to use it only for lawful purposes and in a way that does not infringe the rights of others. You must not misuse the service, attempt to gain unauthorised access to any part of it, or transmit harmful or offensive content.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">3. Account Responsibility</h4>
            <p>You are responsible for keeping your account credentials secure. Do not share your password with others. You are responsible for all activity that occurs under your account. If you believe your account has been compromised, contact us immediately.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">4. Premium Subscriptions</h4>
            <p>Premium features are available via a paid subscription (monthly or yearly) processed through Polar. Subscriptions renew automatically unless cancelled before the renewal date. Refunds are handled in accordance with Polar's refund policy. Wild Card reserves the right to modify premium pricing with reasonable notice.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">5. Health & Safety Disclaimer</h4>
            <p>Wild Card provides fitness guidance for informational purposes only. Always consult a qualified healthcare professional or certified coach before starting a new training programme. Wild Card is not liable for any injury, illness, or adverse outcome resulting from following training content in the app.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">6. AI-Generated Content</h4>
            <p>AI-generated analysis, position recommendations, and market valuations are estimates produced by automated systems and should not be treated as professional sporting advice. Results may vary and Wild Card makes no guarantees as to their accuracy.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">7. Intellectual Property</h4>
            <p>All content, branding, and code within Wild Card is the intellectual property of Wild Card and its licensors. You may not copy, redistribute, or create derivative works from any part of the app without express written permission.</p>
          </div>
          <div>
            <h4 className="text-[#FF6B00] font-['Oswald'] font-bold text-base mb-2">8. Termination</h4>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time. Upon termination, your access to the service will cease and your data may be deleted in accordance with our Privacy Policy.</p>
          </div>
          <p className="text-gray-500 text-xs border-t border-[#1A1A1A] pt-3">Last updated: May 2026</p>
        </div>
      </Section>

      {/* ── Account actions ── */}
      <Card className="bg-[#000000] border-[#2A2A2A] p-5 mt-2">
        <h3 className="font-['Oswald'] text-[#FF6B00] font-bold text-base mb-3">Account</h3>
        <div className="bg-[#0A0A0A] rounded-lg p-3 text-sm mb-3">
          <div className="text-gray-400 text-xs mb-1">Signed in as</div>
          <div className="text-white font-bold">@{username}</div>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Sign in on any device with your username and password to access your data.
        </p>
        <Button onClick={handleLogout} variant="outline"
          className="w-full border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </Card>
    </section>
  );
}
