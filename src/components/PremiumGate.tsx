import { useQuery } from "@tanstack/react-query";
import { userSessionManager } from "@/lib/userSession";
import { Zap } from "lucide-react";

interface AiUsageData {
  valuation: { used: number; limit: number };
  positionAnalysis: { used: number; limit: number };
}

interface PremiumGateProps {
  children: React.ReactNode;
  featureName?: string;
  featureIcon?: React.ElementType;
  feature?: "valuation" | "positionAnalysis";
}

export default function PremiumGate({ children, featureName, feature }: PremiumGateProps) {
  const currentUserId = userSessionManager.getNumericUserId();

  const { data: aiUsage } = useQuery<AiUsageData>({
    queryKey: [`/api/users/${currentUserId}/ai-usage`],
    retry: false,
  });

  if (!feature || !aiUsage) return <>{children}</>;

  const usage = aiUsage[feature];
  const remaining = usage.limit - usage.used;

  return (
    <div className="space-y-3">
      {remaining > 0 && (
        <div className="flex items-center justify-between bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-gray-300 text-sm">{featureName || "AI Feature"}</span>
          </div>
          <span className="text-[#FF6B00] text-sm font-bold">{remaining}/{usage.limit} free uses left</span>
        </div>
      )}
      {remaining <= 0 && (
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-center">
          <p className="text-gray-400 text-sm">You've used all {usage.limit} free {featureName || "AI"} analyses.</p>
        </div>
      )}
      {remaining > 0 && children}
    </div>
  );
}
