import { FC, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { userSessionManager } from "@/lib/userSession";
import { useToast } from "@/hooks/use-toast";

interface PlayerValuationData {
  id: number;
  userId: number;
  marketValue: number;
  tier: string;
  strengths: string[];
  weaknesses: string[];
  improvementPlan: Array<{
    priority: string;
    actions: string[];
    expectedValueIncrease: number;
    timeframe: string;
  }>;
  professionalComparison: string;
  overallRating: number;
  advice: string;
  createdAt: string;
  updatedAt: string;
}

const ValuationContent: FC = () => {
  const [valuation, setValuation] = useState<PlayerValuationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const currentUserId = userSessionManager.getNumericUserId();

  const { toast } = useToast();

  useEffect(() => {
    fetchValuation();
  }, []);

  const fetchValuation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${currentUserId}/valuation`);
      if (response.ok) setValuation(await response.json());
      else if (response.status === 404) setValuation(null);
    } catch (error) {
      console.error("Failed to fetch valuation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateValuation = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch(`/api/users/${currentUserId}/valuation/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setValuation(await response.json());
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to calculate valuation. Please try again.", variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Elite": return "text-yellow-400 border-yellow-400";
      case "Professional": return "text-green-400 border-green-400";
      case "Semi-Pro": return "text-blue-400 border-blue-400";
      default: return "text-gray-400 border-gray-400";
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case "Elite": return "🏆";
      case "Professional": return "⚽";
      case "Semi-Pro": return "🥉";
      default: return "🎯";
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-6">
        <button
          onClick={calculateValuation}
          disabled={isCalculating}
          className="w-full bg-[#FF6B00] text-white font-['Oswald'] text-lg py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isCalculating ? "Analyzing Your Performance..." : valuation ? "Recalculate Market Value" : "Calculate My Market Value"}
        </button>
      </div>

      {isLoading ? (
        <Card className="bg-[#000000] rounded-lg p-6">
          <div className="text-center text-[#FF6B00] text-lg">Loading valuation...</div>
        </Card>
      ) : valuation ? (
        <div className="space-y-6">
          <Card className="bg-[#000000] rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="text-[#FF6B00] text-sm font-['Oswald'] uppercase tracking-wide mb-2">Current Market Value</div>
              <div className="text-4xl font-['Oswald'] font-bold text-white mb-2">{formatCurrency(valuation.marketValue)}</div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getTierColor(valuation.tier)}`}>
                <span className="text-lg">{getTierEmoji(valuation.tier)}</span>
                <span className="font-['Oswald'] font-bold">{valuation.tier} Player</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[#FF6B00] text-sm mb-1">Overall Rating</div>
              <div className="text-2xl font-['Oswald'] text-white">{valuation.overallRating}/100</div>
              <div className="w-full bg-[#2A2A2A] rounded-full h-2 mt-2">
                <div className="bg-[#FF6B00] h-2 rounded-full transition-all duration-500" style={{ width: `${valuation.overallRating}%` }} />
              </div>
            </div>
          </Card>

          <Card className="bg-[#000000] rounded-lg p-6">
            <h3 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00] mb-3">Professional Assessment</h3>
            <div className="text-white leading-relaxed">{valuation.professionalComparison}</div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#000000] rounded-lg p-6">
              <h3 className="font-['Montserrat'] text-lg font-bold text-green-400 mb-4">Strengths</h3>
              <div className="space-y-2">
                {valuation.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-white">{s}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="bg-[#000000] rounded-lg p-6">
              <h3 className="font-['Montserrat'] text-lg font-bold text-red-400 mb-4">Areas to Improve</h3>
              <div className="space-y-2">
                {valuation.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-white">{w}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="bg-[#000000] rounded-lg p-6">
            <h3 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00] mb-4">Development Plan</h3>
            <div className="space-y-4">
              {valuation.improvementPlan.map((plan, i) => (
                <div key={i} className="border-l-4 border-[#FF6B00] pl-4">
                  <div className="font-['Oswald'] text-lg text-white mb-2">{plan.priority}</div>
                  <div className="text-sm text-gray-300 mb-2">
                    Potential value increase: <span className="text-[#FF6B00] font-bold">{formatCurrency(plan.expectedValueIncrease)}</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">Timeline: {plan.timeframe}</div>
                  <div className="space-y-1">
                    {plan.actions.map((action, j) => (
                      <div key={j} className="text-sm text-gray-300 flex items-center gap-2">
                        <div className="w-1 h-1 bg-[#FF6B00] rounded-full" />{action}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {valuation.advice && (
            <Card className="bg-[#000000] rounded-lg p-6">
              <h3 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00] mb-4">AI Coach Advice</h3>
              <div className="text-white leading-relaxed italic">"{valuation.advice}"</div>
            </Card>
          )}

          <div className="text-center text-sm text-gray-500">
            Last updated: {new Date(valuation.updatedAt).toLocaleDateString()}
          </div>
        </div>
      ) : (
        <Card className="bg-[#000000] rounded-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⚽</div>
            <div className="text-[#FF6B00] text-xl font-['Oswald'] mb-2">Ready to discover your worth?</div>
            <div className="text-gray-300 mb-4">
              Get an AI-powered professional assessment of your football skills and market value.
            </div>
            <div className="text-sm text-gray-500">Click "Calculate My Market Value" to get started!</div>
          </div>
        </Card>
      )}
    </div>
  );
};

const Valuation: FC = () => (
  <section className="tab-content animate-in slide-in-from-left duration-300">
    <div className="mb-6">
      <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">
        Player Valuation
      </h2>
      <ValuationContent />
    </div>
  </section>
);

export default Valuation;
