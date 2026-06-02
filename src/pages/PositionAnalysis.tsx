import { useState, type FC } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Edit2, Check, X, Zap, Star } from "lucide-react";
import { userSessionManager } from "@/lib/userSession";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

const POSITION_TRAINING_FOCUS: Record<string, string[]> = {
  GK: ["Reflexes & Diving", "Positioning", "Distribution", "Aerial Dominance"],
  CB: ["Defensive Strength", "Heading", "Tackling", "Positional Awareness"],
  RB: ["Stamina & Speed", "Crossing", "Tackling", "Overlapping Runs"],
  LB: ["Stamina & Speed", "Crossing", "Tackling", "Overlapping Runs"],
  CDM: ["Defensive Strength", "Passing Range", "Positioning", "Ball Recovery"],
  CM: ["Passing", "Ball Control", "Stamina", "Vision"],
  CAM: ["Shooting", "Dribbling", "Passing", "Ball Control"],
  RW: ["Dribbling", "Pace", "Crossing", "Finishing"],
  LW: ["Dribbling", "Pace", "Crossing", "Finishing"],
  ST: ["Finishing", "Heading", "Explosive Power", "Movement"],
};

const PositionStatus: FC = () => {
  const currentUserId = userSessionManager.getNumericUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editCurrentPos, setEditCurrentPos] = useState("");
  const [editGoalPos, setEditGoalPos] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const { data: positionData, isLoading } = useQuery<{ currentPosition: string | null; goalPosition: string | null }>({
    queryKey: [`/api/users/${currentUserId}/position-status`],
    retry: false,
  });

  const { data: aiUsage } = useQuery<{
    valuation: { used: number; limit: number };
    positionAnalysis: { used: number; limit: number };
  }>({
    queryKey: [`/api/users/${currentUserId}/ai-usage`],
    retry: false,
  });

  const updatePositionMutation = useMutation({
    mutationFn: (data: { currentPosition: string; goalPosition: string }) =>
      apiRequest("PUT", `/api/users/${currentUserId}/position-status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/position-status`] });
      toast({ title: "Position Updated", description: "Your position profile has been saved!" });
      setIsEditing(false);
    },
    onError: () => toast({ title: "Error", description: "Failed to update position", variant: "destructive" }),
  });

  const handleEdit = () => {
    setEditCurrentPos(positionData?.currentPosition || "");
    setEditGoalPos(positionData?.goalPosition || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editCurrentPos || !editGoalPos) {
      toast({ title: "Please select both positions", variant: "destructive" });
      return;
    }
    updatePositionMutation.mutate({ currentPosition: editCurrentPos, goalPosition: editGoalPos });
  };

  const analyzePosition = async () => {
    const remaining = aiUsage ? aiUsage.positionAnalysis.limit - aiUsage.positionAnalysis.used : 0;
    if (remaining <= 0) {
      toast({ title: "Limit Reached", description: "You've used all 5 AI position analyses.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/users/${currentUserId}/position/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setAnalysisResult(await response.json());
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/ai-usage`] });
        toast({ title: "Analysis Complete", description: "Your position analysis is ready!" });
      } else {
        const err = await response.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Analysis failed. Try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const goalPos = positionData?.goalPosition;
  const currentPos = positionData?.currentPosition;
  const trainingFocus = goalPos ? (POSITION_TRAINING_FOCUS[goalPos] || []) : [];
  const positionInfo = (pos: string | null | undefined) => pos ? POSITIONS.find(p => p.value === pos) : null;
  const posAnalysisUsed = aiUsage?.positionAnalysis.used ?? 0;
  const posAnalysisLimit = aiUsage?.positionAnalysis.limit ?? 5;
  const posAnalysisRemaining = posAnalysisLimit - posAnalysisUsed;

  return (
    <section className="tab-content animate-in slide-in-from-left duration-300">
      <div className="mb-6">
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-1 border-l-4 border-[#FF6B00] pl-3">
          Position Status
        </h2>
        <p className="text-gray-400 text-sm pl-4">Manage your position goals and get AI coaching advice</p>
      </div>

      {/* Current Position + Goal */}
      <Card className="bg-[#000000] border-[#2A2A2A] p-5 mb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full" />
          </div>
        ) : isEditing ? (
          <div className="space-y-5">
            <div>
              <label className="block text-[#FF6B00] font-['Oswald'] text-sm font-bold uppercase tracking-wide mb-3">
                Current Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => setEditCurrentPos(pos.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      editCurrentPos === pos.value
                        ? "border-[#FF6B00] bg-[#FF6B00]/10 text-white"
                        : "border-[#2A2A2A] bg-[#0A0A0A] text-gray-400 hover:border-[#FF6B00]/50"
                    }`}
                  >
                    <span className="text-lg mr-2">{pos.emoji}</span>
                    <span className="font-bold text-sm">{pos.short}</span>
                    <span className="text-xs text-gray-500 ml-1">— {pos.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[#FF6B00] font-['Oswald'] text-sm font-bold uppercase tracking-wide mb-3">
                Goal Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => setEditGoalPos(pos.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      editGoalPos === pos.value
                        ? "border-[#FF6B00] bg-[#FF6B00]/10 text-white"
                        : "border-[#2A2A2A] bg-[#0A0A0A] text-gray-400 hover:border-[#FF6B00]/50"
                    }`}
                  >
                    <span className="text-lg mr-2">{pos.emoji}</span>
                    <span className="font-bold text-sm">{pos.short}</span>
                    <span className="text-xs text-gray-500 ml-1">— {pos.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={updatePositionMutation.isPending}
                className="flex-1 bg-[#FF6B00] hover:bg-orange-600 text-black font-bold"
              >
                <Check className="w-4 h-4 mr-2" />
                {updatePositionMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="border-[#2A2A2A] text-white hover:bg-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-['Oswald'] text-white text-base font-bold">Your Position Profile</h3>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-[#FF6B00] text-sm font-medium hover:text-orange-400"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            {!currentPos && !goalPos ? (
              <div className="text-center py-6">
                <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">No positions set yet. Set your current position and goal!</p>
                <Button onClick={handleEdit} className="bg-[#FF6B00] hover:bg-orange-600 text-black font-bold">
                  Set My Positions
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0A0A] rounded-xl p-4 border border-[#2A2A2A]">
                  <div className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-['Oswald']">Current</div>
                  {currentPos ? (
                    <>
                      <div className="text-3xl mb-1">{positionInfo(currentPos)?.emoji}</div>
                      <div className="text-white font-['Oswald'] text-2xl font-bold">{currentPos}</div>
                      <div className="text-gray-400 text-xs">{positionInfo(currentPos)?.label}</div>
                    </>
                  ) : (
                    <div className="text-gray-600 text-sm">Not set</div>
                  )}
                </div>
                <div className="bg-[#FF6B00]/5 rounded-xl p-4 border border-[#FF6B00]/30">
                  <div className="text-[#FF6B00] text-xs uppercase tracking-wide mb-2 font-['Oswald']">Goal</div>
                  {goalPos ? (
                    <>
                      <div className="text-3xl mb-1">{positionInfo(goalPos)?.emoji}</div>
                      <div className="text-white font-['Oswald'] text-2xl font-bold">{goalPos}</div>
                      <div className="text-gray-400 text-xs">{positionInfo(goalPos)?.label}</div>
                    </>
                  ) : (
                    <div className="text-gray-600 text-sm">Not set</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Training Focus for Goal Position */}
      {goalPos && trainingFocus.length > 0 && !isEditing && (
        <Card className="bg-[#000000] border-[#2A2A2A] p-5 mb-4">
          <h3 className="font-['Oswald'] text-white text-base font-bold mb-3">
            Training Focus for {positionInfo(goalPos)?.label}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {trainingFocus.map((focus) => (
              <div key={focus} className="flex items-center gap-2 bg-[#0A0A0A] rounded-lg p-3 border border-[#1A1A1A]">
                <div className="w-2 h-2 bg-[#FF6B00] rounded-full flex-shrink-0" />
                <span className="text-gray-300 text-sm">{focus}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Position Analysis */}
      <Card className="bg-[#000000] border-[#2A2A2A] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-['Oswald'] text-white text-base font-bold">AI Position Analysis</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            posAnalysisRemaining > 0 ? "bg-[#FF6B00]/20 text-[#FF6B00]" : "bg-gray-800 text-gray-500"
          }`}>
            {posAnalysisRemaining}/{posAnalysisLimit} left
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Get AI-powered coaching advice based on your training data and position goals.
        </p>
        {posAnalysisRemaining <= 0 ? (
          <div className="bg-[#1A1A1A] rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">You've used all {posAnalysisLimit} AI position analyses.</p>
          </div>
        ) : (
          <Button
            onClick={analyzePosition}
            disabled={isAnalyzing || !goalPos}
            className="w-full bg-[#FF6B00] hover:bg-orange-600 text-black font-bold"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isAnalyzing ? "Analysing..." : `Run AI Analysis (${posAnalysisRemaining} left)`}
          </Button>
        )}
        {!goalPos && posAnalysisRemaining > 0 && (
          <p className="text-gray-500 text-xs text-center mt-2">Set a goal position first to run analysis</p>
        )}
      </Card>

      {/* Analysis Result */}
      {analysisResult && (
        <Card className="bg-[#000000] border-[#FF6B00]/30 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-['Oswald'] text-white text-base font-bold">Latest Analysis</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#1A1A1A]">
              <div className="text-[#FF6B00] text-xs font-['Oswald'] uppercase tracking-wide mb-2">Primary Recommendation</div>
              <div className="text-white font-bold text-lg">{analysisResult.primaryPosition}</div>
              {analysisResult.secondaryPosition && (
                <div className="text-gray-400 text-sm">Secondary: {analysisResult.secondaryPosition}</div>
              )}
            </div>
            {analysisResult.coachAdvice && (
              <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#1A1A1A]">
                <div className="text-[#FF6B00] text-xs font-['Oswald'] uppercase tracking-wide mb-2">Coach Advice</div>
                <p className="text-gray-300 text-sm leading-relaxed">{analysisResult.coachAdvice}</p>
              </div>
            )}
            {analysisResult.strengths?.length > 0 && (
              <div>
                <div className="text-[#FF6B00] text-xs font-['Oswald'] uppercase tracking-wide mb-2">Strengths</div>
                <div className="space-y-1">
                  {analysisResult.strengths.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysisResult.areasToImprove?.length > 0 && (
              <div>
                <div className="text-[#FF6B00] text-xs font-['Oswald'] uppercase tracking-wide mb-2">Areas to Improve</div>
                <div className="space-y-1">
                  {analysisResult.areasToImprove.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </section>
  );
};

export default PositionStatus;
