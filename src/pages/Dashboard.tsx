import { FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAppState } from "@/hooks/useAppState";
import { useHealthIntegration } from "@/hooks/useHealthIntegration";
import { HealthPermissionsDialog } from "@/components/HealthPermissionsDialog";
import { useProgression } from "@/hooks/useProgression";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useQuery } from "@tanstack/react-query";
import WeeklyProgressChart from "@/components/WeeklyProgressChart";
import ManualHealthEntry from "@/components/GoogleFitIntegration";
import { todayActivities } from "@/data/initialData";
import { userSessionManager } from "@/lib/userSession";
import { Star, Target, TrendingUp, Zap } from "lucide-react";

const POSITION_FOCUS: Record<string, string[]> = {
  GK: ["Reflexes & Diving", "Distribution", "Positioning"],
  CB: ["Defensive Strength", "Heading", "Tackling"],
  RB: ["Stamina & Crossing", "Tackling", "Overlapping Runs"],
  LB: ["Stamina & Crossing", "Tackling", "Overlapping Runs"],
  CDM: ["Ball Recovery", "Passing Range", "Positioning"],
  CM: ["Passing", "Stamina", "Ball Control"],
  CAM: ["Shooting", "Dribbling", "Vision"],
  RW: ["Pace", "Dribbling", "Crossing"],
  LW: ["Pace", "Dribbling", "Crossing"],
  ST: ["Finishing", "Explosive Power", "Movement"],
};

const Dashboard: FC = () => {
  const { weeklyProgress } = useAppState();
  const [showHealthDialog, setShowHealthDialog] = useState(false);
  const currentUserId = userSessionManager.getNumericUserId();

  const { healthData } = useHealthIntegration(currentUserId);
  const { progression } = useProgression(currentUserId);
  const { weeklyProgress: realWeeklyProgress } = useWeeklyProgress(currentUserId);

  const { data: positionStatus } = useQuery<{ currentPosition: string | null; goalPosition: string | null }>({
    queryKey: [`/api/users/${currentUserId}/position-status`],
    staleTime: 60000,
  });

  const currentPos = positionStatus?.currentPosition || null;
  const goalPos = positionStatus?.goalPosition || null;
  const focusAreas = currentPos ? (POSITION_FOCUS[currentPos] || ["Technique", "Fitness", "Decision Making"]) : ["Technique", "Fitness", "Decision Making"];

  return (
    <section className="tab-content animate-in slide-in-from-left duration-300">
      <div className="mb-6">
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">Your Training Status</h2>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Weekly Progress */}
          <Card className="bg-[#2A2A2A] rounded-lg p-4 hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Oswald'] text-lg">Weekly Progress</span>
              <span className="bg-[#FF6B00] text-black px-2 py-1 rounded text-sm font-bold">
                {realWeeklyProgress?.progressPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-[#000000] rounded-full h-2 mb-3">
              <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF9E2C] h-2 rounded-full transition-all duration-500"
                style={{ width: `${realWeeklyProgress?.progressPercentage || 0}%` }} />
            </div>
            <p className="text-sm opacity-70">{realWeeklyProgress?.completed || 0} of {realWeeklyProgress?.weeklyGoal || 7} sessions</p>
          </Card>

          {/* Player Level & XP */}
          <Card className="bg-[#2A2A2A] rounded-lg p-4 hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Oswald'] text-lg">Player Level</span>
              <Star className="w-4 h-4 text-[#FF6B00]" />
            </div>
            <div className="font-['Oswald'] text-3xl text-[#FF6B00] mb-1">
              Lvl {progression?.overallLevel || 1}
            </div>
            <div className="w-full bg-[#000000] rounded-full h-1.5 mb-2">
              <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF9E2C] h-1.5 rounded-full"
                style={{ width: `${progression?.progressToNext || 0}%` }} />
            </div>
            <div className="text-xs text-gray-400">
              {progression?.experience || 0} XP · {Math.round(progression?.progressToNext || 0)}% to next level
            </div>
          </Card>

          {/* Position & Focus */}
          <Card className="bg-[#2A2A2A] rounded-lg p-4 hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Oswald'] text-lg">Position Focus</span>
              <Target className="w-4 h-4 text-[#FF6B00]" />
            </div>
            {currentPos ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#FF6B00] font-bold font-['Oswald'] text-lg">{currentPos}</span>
                  {goalPos && <><span className="text-gray-500">→</span><span className="text-white font-bold font-['Oswald'] text-lg">{goalPos}</span></>}
                </div>
                <div className="space-y-1">
                  {focusAreas.slice(0, 2).map((f, i) => (
                    <div key={i} className="text-xs text-gray-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#FF6B00]" />{f}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Link href="/settings">
                <div className="text-xs text-gray-400 mt-1">Set your position →</div>
              </Link>
            )}
          </Card>
        </div>

        {/* Quick Access Navigation */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-lg p-4 mb-6">
          <h3 className="font-['Montserrat'] text-lg font-bold uppercase mb-4 text-[#FF6B00] flex items-center">
            <i className="fas fa-bolt mr-2"></i>Quick Access
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/training">
              <Button className="w-full bg-[#2A2A2A] hover:bg-[#FF6B00] hover:text-black text-[#E0E0E0] p-4 h-auto flex flex-col items-center gap-2 transition-all duration-300">
                <i className="fas fa-dumbbell text-xl"></i>
                <span className="text-sm font-bold">Training</span>
              </Button>
            </Link>
            <Link href="/techniques">
              <Button className="w-full bg-[#2A2A2A] hover:bg-[#FF6B00] hover:text-black text-[#E0E0E0] p-4 h-auto flex flex-col items-center gap-2 transition-all duration-300">
                <i className="fas fa-futbol text-xl"></i>
                <span className="text-sm font-bold">Techniques</span>
              </Button>
            </Link>
            <Link href="/stats">
              <Button className="w-full bg-[#2A2A2A] hover:bg-[#FF6B00] hover:text-black text-[#E0E0E0] p-4 h-auto flex flex-col items-center gap-2 transition-all duration-300">
                <i className="fas fa-chart-bar text-xl"></i>
                <span className="text-sm font-bold">Stats</span>
              </Button>
            </Link>
            <Link href="/valuation">
              <Button className="w-full bg-[#2A2A2A] hover:bg-[#FF6B00] hover:text-black text-[#E0E0E0] p-4 h-auto flex flex-col items-center gap-2 transition-all duration-300">
                <i className="fas fa-pound-sign text-xl"></i>
                <span className="text-sm font-bold">Market Value</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Skill Highlights */}
        {progression && (
          <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-lg p-4 mb-6">
            <h3 className="font-['Montserrat'] text-base font-bold uppercase mb-3 text-[#FF6B00] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Skill Levels
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Explosive Power", val: progression.explosivePowerLevel },
                { label: "Opposite Foot", val: progression.oppositeFootLevel },
                { label: "Cardio", val: progression.cardioLevel },
                { label: "Strength", val: progression.strengthLevel },
              ].map(({ label, val }) => (
                <div key={label} className="bg-[#0A0A0A] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="font-['Oswald'] text-[#FF6B00] text-xl font-bold">Lvl {val}</div>
                  <div className="w-full bg-[#2A2A2A] h-1 rounded-full mt-1">
                    <div className="bg-[#FF6B00] h-1 rounded-full" style={{ width: `${Math.min((val / 30) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Manual Health Entry */}
        <ManualHealthEntry />

        {/* Weekly Progress Chart */}
        <WeeklyProgressChart
          currentProgress={realWeeklyProgress?.progressPercentage || 0}
          weeklyGoal={realWeeklyProgress?.weeklyGoal || 7}
          completed={realWeeklyProgress?.completed || 0}
          dailyBreakdown={realWeeklyProgress?.dailyBreakdown || []}
        />

        {/* Today's Plan */}
        <Card className="bg-[#000000] rounded-lg p-4 mb-6">
          <h3 className="font-['Montserrat'] text-lg font-bold uppercase mb-3 text-[#FF6B00]">Today's Plan</h3>
          <div className="space-y-3">
            {todayActivities.map((activity) => (
              <div key={activity.id} className="bg-[#2A2A2A] p-3 rounded-lg flex items-center">
                <div className="w-10 h-10 bg-[#FF6B00] rounded-full flex items-center justify-center mr-3">
                  <i className={`fas fa-${activity.icon} text-black`}></i>
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{activity.name}</div>
                  <div className="text-sm opacity-70">
                    {activity.duration && `${activity.duration} • `}{activity.description}
                  </div>
                </div>
                <Link href="/training">
                  <Button className="bg-[#FF6B00] hover:bg-[#FF9E2C] text-black px-3 py-1 rounded-full text-sm font-bold transition-colors">
                    {activity.type === "nutrition" ? "View" : "Start"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Progression Chart */}
        <Card className="bg-[#000000] rounded-lg p-4">
          <h3 className="font-['Montserrat'] text-lg font-bold uppercase mb-3 text-[#FF6B00]">Weekly Progression</h3>
          <div className="grid grid-cols-7 gap-1 h-32 items-end">
            {weeklyProgress.dailyProgress.map((day) => (
              <div key={day.day} className="flex flex-col items-center">
                <div className="bg-[#FF6B00] w-full" style={{ height: `${day.intensity}%` }}></div>
                <div className="text-xs mt-2">{day.day}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-center mt-2 opacity-70">Training intensity throughout the week</div>
        </Card>
      </div>

      <HealthPermissionsDialog
        open={showHealthDialog}
        onOpenChange={setShowHealthDialog}
        userId={currentUserId}
        onConnected={() => window.location.reload()}
      />
    </section>
  );
};

export default Dashboard;
