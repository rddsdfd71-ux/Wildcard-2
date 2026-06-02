import { useState, type FC } from "react";
import { useLocation } from "wouter";
import { setAuthUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

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

const AuthPage: FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"auth" | "survey">("auth");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState("");
  const [goalPosition, setGoalPosition] = useState("");
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
        isPremium: false,
      });

      if (mode === "register") {
        setRegisteredUserId(data.userId);
        setStep("survey");
      } else {
        navigate("/");
      }
    } catch {
      toast({ title: "Error", description: "Connection failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySubmit = async () => {
    if (!currentPosition || !goalPosition) {
      toast({ title: "Please select both positions", variant: "destructive" });
      return;
    }
    if (!registeredUserId) { navigate("/"); return; }
    setSavingPositions(true);
    try {
      await fetch(`/api/users/${registeredUserId}/position-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPosition, goalPosition }),
      });
    } catch {
      // Non-critical — user can set later
    } finally {
      setSavingPositions(false);
    }
    navigate("/");
  };

  const handleSkipSurvey = () => navigate("/");

  if (step === "survey") {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <div className="relative h-32 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[#FF6B00]/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="text-[#FF6B00] font-['Oswald'] text-3xl font-bold tracking-wider">WILD CARD</div>
            <div className="text-[#E0E0E0] text-sm">One last step — tell us about your position</div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-4 pb-10 overflow-y-auto">
          <div className="mb-6">
            <h2 className="font-['Oswald'] text-2xl font-bold text-white mb-1">Your Position Goals</h2>
            <p className="text-gray-400 text-sm">
              We'll use this to personalise your training programs and techniques.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center text-xs font-bold text-black">✓</div>
              <span className="text-gray-400 text-xs">Account</span>
            </div>
            <div className="flex-1 h-px bg-[#FF6B00]" />
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center text-xs font-bold text-black">2</div>
              <span className="text-white text-xs font-bold">Position</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#FF6B00] mb-3 font-['Oswald'] uppercase tracking-wide">
                What is your current position?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => setCurrentPosition(pos.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      currentPosition === pos.value
                        ? "border-[#FF6B00] bg-[#FF6B00]/10 text-white"
                        : "border-[#2A2A2A] bg-[#1A1A1A] text-gray-400 hover:border-[#FF6B00]/50"
                    }`}
                  >
                    <span className="text-xl mr-2">{pos.emoji}</span>
                    <span className="font-bold text-sm">{pos.short}</span>
                    <div className="text-xs text-gray-500 mt-0.5">{pos.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#FF6B00] mb-3 font-['Oswald'] uppercase tracking-wide">
                What position do you want to master?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => setGoalPosition(pos.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      goalPosition === pos.value
                        ? "border-[#FF6B00] bg-[#FF6B00]/10 text-white"
                        : "border-[#2A2A2A] bg-[#1A1A1A] text-gray-400 hover:border-[#FF6B00]/50"
                    }`}
                  >
                    <span className="text-xl mr-2">{pos.emoji}</span>
                    <span className="font-bold text-sm">{pos.short}</span>
                    <div className="text-xs text-gray-500 mt-0.5">{pos.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSurveySubmit}
              disabled={savingPositions || !currentPosition || !goalPosition}
              className="w-full bg-[#FF6B00] text-black font-['Oswald'] text-lg font-bold py-3 rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPositions ? "SAVING..." : "START TRAINING →"}
            </button>
            <button onClick={handleSkipSurvey} className="w-full text-gray-500 text-sm py-2 hover:text-gray-400 transition-colors">
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-md font-['Oswald'] text-sm font-bold transition-all ${
              mode === "login" ? "bg-[#FF6B00] text-black" : "text-[#E0E0E0] hover:text-[#FF6B00]"
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-md font-['Oswald'] text-sm font-bold transition-all ${
              mode === "register" ? "bg-[#FF6B00] text-black" : "text-[#E0E0E0] hover:text-[#FF6B00]"
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        <div className="mb-6">
          <h2 className="font-['Oswald'] text-2xl font-bold text-white mb-1">
            {mode === "login" ? "Welcome back" : "Join Wild Card"}
          </h2>
          <p className="text-gray-400 text-sm">
            {mode === "login"
              ? "Sign in to access your training data on any device"
              : "Create your free account and start training today"}
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-bold text-[#FF6B00] mb-2 font-['Oswald'] uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#FF6B00] mb-2 font-['Oswald'] uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#FF6B00] mb-2 font-['Oswald'] uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              required
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full bg-[#FF6B00] text-black font-['Oswald'] text-lg font-bold py-3 rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading
              ? mode === "login" ? "SIGNING IN..." : "CREATING ACCOUNT..."
              : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT →"}
          </button>
        </form>

        <div className="mt-10 space-y-3">
          {[
            { icon: "📊", text: "Track all training stats across every device" },
            { icon: "🏆", text: "Compete on the global leaderboard" },
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
