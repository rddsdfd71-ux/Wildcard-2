import { FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAppState } from "@/hooks/useAppState";
import { useHealthIntegration } from "@/hooks/useHealthIntegration";
import { HealthPermissionsDialog } from "@/components/HealthPermissionsDialog";
import { useProgression } from "@/hooks/useProgression";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import WeeklyProgressChart from "@/components/WeeklyProgressChart";
import ManualHealthEntry from "@/components/GoogleFitIntegration";
import { todayActivities } from "@/data/initialData";

const Dashboard: FC = () => {
  const { weeklyProgress, healthMetrics, userStats } = useAppState();
  const [showHealthDialog, setShowHealthDialog] = useState(false);
  
  // Real health data integration and progression data
  const { 
    healthData, 
    hasPermissions, 
    isConnected,
    getStepProgress,
    getHealthSource 
  } = useHealthIntegration(1);
  const { progression } = useProgression(1);
  const { weeklyProgress: realWeeklyProgress } = useWeeklyProgress(1);
  
  return (
    <section className="tab-content animate-in slide-in-from-left duration-300">
      <div className="mb-6">
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">Your Training Status</h2>
        
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Weekly Progress Card */}
          <Card className="bg-[#2A2A2A] rounded-lg p-4 hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Oswald'] text-lg">Weekly Progress</span>
              <span className="bg-[#FF6B00] text-black px-2 py-1 rounded text-sm font-bold">
                {realWeeklyProgress?.progressPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-[#000000] rounded-full h-2 mb-3">
              <div 
                className="bg-gradient-to-r from-[#FF6B00] to-[#FF9E2C] h-2 rounded-full transition-all duration-500"
                style={{ width: `${realWeeklyProgress?.progressPercentage || 0}%` }}
              ></div>
            </div>
            <p className="text-sm opacity-70">{realWeeklyProgress?.completed || 0} of {realWeeklyProgress?.weeklyGoal || 7} sessions completed</p>
          </Card>
          
          {/* Strength Stats Card */}
          <Card className="bg-[#2A2A2A] rounded-lg p-4 hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Oswald'] text-lg">Strength Stats</span>
              <i className="fas fa-dumbbell text-[#FF6B00]"></i>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-sm opacity-70">Upper Body</div>
                <div className="font-['Oswald'] text-[#FF9E2C] text-xl">
                  Level {progression?.upperBodyLevel || 0}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-70">Lower Body</div>
                <div className="font-['Oswald'] text-[#FF9E2C] text-xl">
                  Level {progression?.lowerBodyLevel || 0}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Cardio Performance Card */}
          <Card className="bg-[#2A2A2A] rounded-lg p-4 hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Oswald'] text-lg">Cardio</span>
              <i className="fas fa-heartbeat text-[#FF6B00]"></i>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-[#000000] flex items-center justify-center">
                <i className="fas fa-running text-[#FF6B00] text-lg"></i>
              </div>
              <div>
                <div className="text-sm opacity-70">Today's Steps</div>
                <div className="font-['Oswald'] text-[#FF9E2C] text-xl">{healthData?.steps.toLocaleString() || '0'}</div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Quick Access Navigation */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-lg p-4 mb-6">
          <h3 className="font-['Montserrat'] text-lg font-bold uppercase mb-4 text-[#FF6B00] flex items-center">
            <i className="fas fa-bolt mr-2"></i>
            Quick Access
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
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            <Link href="/valuation">
              <Button className="w-full bg-[#2A2A2A] hover:bg-[#FF6B00] hover:text-black text-[#E0E0E0] p-4 h-auto flex flex-col items-center gap-2 transition-all duration-300">
                <i className="fas fa-pound-sign text-xl"></i>
                <span className="text-sm font-bold">Market Value</span>
              </Button>
            </Link>
            <Link href="/position">
              <Button className="w-full bg-[#2A2A2A] hover:bg-[#FF6B00] hover:text-black text-[#E0E0E0] p-4 h-auto flex flex-col items-center gap-2 transition-all duration-300">
                <i className="fas fa-map-marker-alt text-xl"></i>
                <span className="text-sm font-bold">Position</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button className="w-full bg-[#2A2A2A] hover:bg-[#FF6B00] hover:text-black text-[#E0E0E0] p-4 h-auto flex flex-col items-center gap-2 transition-all duration-300">
                <i className="fas fa-cog text-xl"></i>
                <span className="text-sm font-bold">Settings</span>
              </Button>
            </Link>
          </div>
        </Card>
        
        {/* Manual Health Entry Section */}
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
            {/* Map through today's activities */}
            {todayActivities.map((activity) => (
              <div key={activity.id} className="bg-[#2A2A2A] p-3 rounded-lg flex items-center">
                <div className="w-10 h-10 bg-[#FF6B00] rounded-full flex items-center justify-center mr-3">
                  <i className={`fas fa-${activity.icon} text-black`}></i>
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{activity.name}</div>
                  <div className="text-sm opacity-70">
                    {activity.duration && `${activity.duration} • `}
                    {activity.description}
                  </div>
                </div>
                <Button className="bg-[#FF6B00] hover:bg-[#FF9E2C] text-black px-3 py-1 rounded-full text-sm font-bold transition-colors">
                  {activity.type === "nutrition" ? "View" : "Start"}
                </Button>
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
                <div 
                  className="bg-[#FF6B00] w-full" 
                  style={{ height: `${day.intensity}%` }}
                ></div>
                <div className="text-xs mt-2">{day.day}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-center mt-2 opacity-70">Training intensity throughout the week</div>
        </Card>
      </div>

      {/* Health Permissions Dialog */}
      <HealthPermissionsDialog
        open={showHealthDialog}
        onOpenChange={setShowHealthDialog}
        userId={1}
        onConnected={() => {
          // Refresh health data after connection
          window.location.reload();
        }}
      />
    </section>
  );
};

export default Dashboard;
