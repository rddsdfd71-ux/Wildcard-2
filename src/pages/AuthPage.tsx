import { useState, type FC } from "react";
import { useLocation } from "wouter";
import { setAuthUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { identifyUser, trackEvent } from "@/lib/analytics";

const POSITIONS = [
  { value: "GK", label: "Goalkeeper", short: "GK", emoji: "🧤" },
  { value: "CB", label: "Centre Back", short: "CB", emoji: "🛡️" },
  { value: "RB", label: "Right Back", short: "RB", emoji: "➡️" },
  { value: "LB", label: "Left Back", short: "LB", emoji: "⬅️" },
  { value: "CDM", label: "Defensive Midfielder", short: "CDM", emoji: "⚙️" },
  { value: "CM", label: "Central Midfielder", short: "CM", emoji: "🔄" },
  { value: "CAM", label: "Attacking Midfielder", short: "CAM", emoji: "🎯" },
  { value: "RW", label: "Right Winger", short: "RW", emoji: "⚡" },
  { value: "LW", label: "Left Winger", short: "LW", emoji: "⚡" },
  { value: "ST", label: "Striker", short: "ST", emoji: "🔥" },
];

const COUNTRIES = [
  "England", "Nigeria", "Ghana", "Brazil", "France", "Spain", "Germany",
  "Argentina", "Portugal", "Italy", "Netherlands", "Belgium", "Senegal",
  "Cameroon", "Ivory Coast", "Jamaica", "Trinidad & Tobago", "United States",
  "Canada", "Mexico", "Colombia", "Chile", "Uruguay", "Japan", "South Korea",
  "Australia", "Morocco", "Egypt", "Algeria", "Tunisia", "South Africa",
  "Kenya", "Ethiopia", "Tanzania", "Uganda", "Zimbabwe", "Zambia",
  "Saudi Arabia", "UAE", "Turkey", "Poland", "Sweden", "Norway", "Denmark",
  "Scotland", "Wales", "Ireland", "Other"
];

type Step = "auth" | "survey" | "country" | "discord";

const AuthPage: FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<Step>("auth");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState("");
  const [goalPosition, setGoalPosition] = useState("");
  const [country, setCountry] = useState("");
  const [savingPositions, setSavingPositions] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { username: username.trim(), password }
        : { username: username.trim(), password, fullName: fullName.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }

      setAuthUser({
        userId: data.userId,
        username: data.username,
        fullName: data.fullName,
        isPremium: data.isPremium || false,
      });

      identifyUser(data.userId, data.username, data.fullName);
      trackEvent(mode === "login" ? "user_signed_in" : "user_registered", {
        userId: data.userId,
        username: data.username,
      });

      if (mode === "register") {
        setRegisteredUserId(data.userId);
        setStep("survey");
      } else {
        navigate("/");
      }
    } catch {
      toast({ title: "Connection Error", description: "Could not reach the server. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentPosition || !goalPosition) {
      toast({ title: "Please select both positions", variant: "destructive" });
      return;
    }
    if (!registeredUserId) { setStep("country"); return; }
    setSavingPositions(true);
    try {
      await fetch(`/api/users/${registeredUserId}/position-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPosition, goalPosition }),
      });
      trackEvent("position_selected", { currentPosition, goalPosition });
    } catch { /* non-critical */ }
    finally { setSavingPositions(false); }
    setStep("country");
  };

  const handleCountrySubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!country) {
      toast({ title: "Please select your country", variant: "destructive" });
      return;
    }
    if (registeredUserId) {
      try {
        await fetch(`/api/users/${registeredUserId}/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        });
      } catch { /* non-critical */ }
    }
    setStep("discord");
  };

  const goToApp = () => navigate("/");

  // ── STEP: POSITION SURVEY ─────────────────────────────────────────────────
  if (step === "survey") {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <div className="relative h-32 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[#FF6B00]/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="text-[#FF6B00] font-['Oswald'] text-3xl font-bold tracking-wider">WILD CARD</div>
            <div className="text-[#E0E0E0] text-sm">Step 2 — Your position goals</div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-4 pb-10 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            {["Account", "Position", "Country", "Community"].map((label, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < 1 ? "bg-[#FF6B00] text-black" : i === 1 ? "bg-[#FF6B00] text-black" : "bg-[#2A2A2A] text-gray-500"}`}>
                  {i < 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === 1 ? "text-white font-bold" : "text-gray-500"}`}>{label}</span>
                {i < 3 && <div className={`flex-1 h-px ${i < 1 ? "bg-[#FF6B00]" : "bg-[#2A2A2A]"}`} />}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="font-['Oswald'] text-2xl font-bold text-white mb-1">Your Position Goals</h2>
            <p className="text-gray-400 text-sm">We'll personalise your training and techniques around these.</p>
          </div>

          <form onSubmit={handleSurveySubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#FF6B00] mb-3 font-['Oswald'] uppercase tracking-wide">
                Current Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map(pos => (
                  <button type="button" key={pos.value} onClick={() => setCurrentPosition(pos.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${currentPosition === pos.value ? "border-[#FF6B00] bg-[#FF6B00]/10 text-white" : "border-[#2A2A2A] bg-[#1A1A1A] text-gray-400 hover:border-[#FF6B00]/50"}`}>
                    <span className="text-xl mr-2">{pos.emoji}</span>
                    <span className="font-bold text-sm">{pos.short}</span>
                    <div className="text-xs text-gray-500 mt-0.5">{pos.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#FF6B00] mb-3 font-['Oswald'] uppercase tracking-wide">
                Goal Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map(pos => (
                  <button type="button" key={pos.value} onClick={() => setGoalPosition(pos.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${goalPosition === pos.value ? "border-[#FF6B00] bg-[#FF6B00]/10 text-white" : "border-[#2A2A2A] bg-[#1A1A1A] text-gray-400 hover:border-[#FF6B00]/50"}`}>
                    <span className="text-xl mr-2">{pos.emoji}</span>
                    <span className="font-bold text-sm">{pos.short}</span>
                    <div className="text-xs text-gray-500 mt-0.5">{pos.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={savingPositions || !currentPosition || !goalPosition}
              className="w-full bg-[#FF6B00] text-black font-['Oswald'] text-lg font-bold py-3 rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {savingPositions ? "SAVING..." : "CONTINUE →"}
            </button>
            <button type="button" onClick={() => setStep("country")} className="w-full text-gray-500 text-sm py-2 hover:text-gray-400 transition-colors">
              Skip for now
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── STEP: COUNTRY ────────────────────────────────────────────────────────
  if (step === "country") {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <div className="relative h-32 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[#FF6B00]/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="text-[#FF6B00] font-['Oswald'] text-3xl font-bold tracking-wider">WILD CARD</div>
            <div className="text-[#E0E0E0] text-sm">Step 3 — Where are you from?</div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-4 pb-10 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            {["Account", "Position", "Country", "Community"].map((label, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < 2 ? "bg-[#FF6B00] text-black" : i === 2 ? "bg-[#FF6B00] text-black" : "bg-[#2A2A2A] text-gray-500"}`}>
                  {i < 2 ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === 2 ? "text-white font-bold" : "text-gray-500"}`}>{label}</span>
                {i < 3 && <div className={`flex-1 h-px ${i < 2 ? "bg-[#FF6B00]" : "bg-[#2A2A2A]"}`} />}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="font-['Oswald'] text-2xl font-bold text-white mb-1">🌍 Your Country</h2>
            <p className="text-gray-400 text-sm">Compete on country leaderboards and represent your nation.</p>
          </div>

          <form onSubmit={handleCountrySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {COUNTRIES.map(c => (
                <button type="button" key={c} onClick={() => setCountry(c)}
                  className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${country === c ? "border-[#FF6B00] bg-[#FF6B00]/10 text-white" : "border-[#2A2A2A] bg-[#1A1A1A] text-gray-400 hover:border-[#FF6B00]/50"}`}>
                  {c}
                </button>
              ))}
            </div>

            <button type="submit" disabled={!country}
              className="w-full bg-[#FF6B00] text-black font-['Oswald'] text-lg font-bold py-3 rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              CONTINUE →
            </button>
            <button type="button" onClick={() => setStep("discord")} className="w-full text-gray-500 text-sm py-2 hover:text-gray-400 transition-colors">
              Skip for now
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── STEP: DISCORD / FINAL ────────────────────────────────────────────────
  if (step === "discord") {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <div className="relative h-32 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[#FF6B00]/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="text-[#FF6B00] font-['Oswald'] text-3xl font-bold tracking-wider">WILD CARD</div>
            <div className="text-[#E0E0E0] text-sm">Step 4 — Join the community</div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-4 pb-10 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
          </div>

          <h2 className="font-['Oswald'] text-2xl font-bold text-white mb-3">Join the Wild Card Community</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xs">
            Connect with other players, share progress, give feedback, and stay updated on new features.
          </p>

          <a
            href="https://discord.gg/p8CmbBGyT"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-xs bg-[#5865F2] text-white font-['Oswald'] text-lg font-bold py-3 rounded-lg hover:bg-[#4752C4] transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Join Discord Server
          </a>

          <button
            onClick={goToApp}
            className="w-full max-w-xs bg-[#FF6B00] text-black font-['Oswald'] text-lg font-bold py-3 rounded-lg hover:bg-orange-500 transition-colors"
          >
            START TRAINING →
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: AUTH (login / register) ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121212]" />
        <div className="absolute inset-0 bg-[#FF6B00]/10" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="text-[#FF6B00] font-['Oswald'] text-3xl font-bold tracking-wider">WILD CARD</div>
          <div className="text-[#E0E0E0] text-sm">Your Personal Football Coach</div>
        </div>
      </div>

      <div className="flex-1 px-6 pt-4 pb-10">
        <div className="flex bg-[#1A1A1A] rounded-lg p-1 mb-8">
          <button onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-md font-['Oswald'] text-sm font-bold transition-all ${mode === "login" ? "bg-[#FF6B00] text-black" : "text-[#E0E0E0] hover:text-[#FF6B00]"}`}>
            SIGN IN
          </button>
          <button onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-md font-['Oswald'] text-sm font-bold transition-all ${mode === "register" ? "bg-[#FF6B00] text-black" : "text-[#E0E0E0] hover:text-[#FF6B00]"}`}>
            CREATE ACCOUNT
          </button>
        </div>

        <div className="mb-6">
          <h2 className="font-['Oswald'] text-2xl font-bold text-white mb-1">
            {mode === "login" ? "Welcome back" : "Join Wild Card"}
          </h2>
          <p className="text-gray-400 text-sm">
            {mode === "login" ? "Sign in to access your training data on any device" : "Create your free account and start training today"}
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-bold text-[#FF6B00] mb-2 font-['Oswald'] uppercase tracking-wide">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF6B00] transition-colors" />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#FF6B00] mb-2 font-['Oswald'] uppercase tracking-wide">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username" autoCapitalize="none" autoCorrect="off" autoComplete="username" required
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF6B00] transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#FF6B00] mb-2 font-['Oswald'] uppercase tracking-wide">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"} required
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF6B00] transition-colors" />
          </div>

          <button type="submit" disabled={loading || !username.trim() || !password.trim()}
            className="w-full bg-[#FF6B00] text-black font-['Oswald'] text-lg font-bold py-3 rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {loading
              ? (mode === "login" ? "SIGNING IN..." : "CREATING ACCOUNT...")
              : (mode === "login" ? "SIGN IN" : "CREATE ACCOUNT →")}
          </button>
        </form>

        <div className="mt-10 space-y-3">
          {[
            { icon: "📊", text: "Track all training stats across every device" },
            { icon: "🏆", text: "Compete on the global & country leaderboard" },
            { icon: "⚽", text: "Everything free — no subscriptions" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
              <span className="text-lg">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
