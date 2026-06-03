import { FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useProgression } from "@/hooks/useProgression";
import ProgressBar from "@/components/stats/ProgressBar";
import ProgressCharts from "@/components/progress/ProgressCharts";
import { Trophy, Target, TrendingUp, Activity, Flame, Clock, Calendar, Globe } from "lucide-react";
import { userSessionManager } from "@/lib/userSession";

interface LeaderboardEntry {
  id: number;
  userId: number;
  rank: number;
  totalScore: number;
  username: string;
  fullName: string;
  country?: string;
  updatedAt: string;
}

interface StatsSummary {
  today: { date: string; label: string; sessions: number; calories: number; minutes: number };
  thisWeek: { sessions: number; calories: number; hours: number };
  allTime: { sessions: number; calories: number; hours: number };
  dailyBreakdown: Array<{ date: string; label: string; sessions: number; calories: number; minutes: number }>;
}

const COUNTRIES = [
  "All Countries", "England", "Nigeria", "Ghana", "Brazil", "France", "Spain",
  "Germany", "Argentina", "Portugal", "Italy", "Netherlands", "Belgium",
  "Senegal", "Cameroon", "Ivory Coast", "Jamaica", "United States", "Canada",
  "Mexico", "Colombia", "Morocco", "Egypt", "South Africa", "Kenya", "Other"
];

const Stats: FC = () => {
  const [chartView, setChartView] = useState<'daily' | 'weekly'>('weekly');
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const currentUserId = userSessionManager.getNumericUserId();
  const { progression } = useProgression(currentUserId);

  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    staleTime: 60000,
  });

  const { data: statsSummary } = useQuery<StatsSummary>({
    queryKey: [`/api/users/${currentUserId}/stats/summary`],
    staleTime: 30000,
    refetchOnMount: true,
  });

  const { data: userScore } = useQuery<{ score: number }>({
    queryKey: [`/api/users/${currentUserId}/score`],
    staleTime: 60000,
  });

  const todayStats = statsSummary?.today;
  const weekStats = statsSummary?.thisWeek;
  const allTimeStats = statsSummary?.allTime;

  const filteredLeaderboard = Array.isArray(leaderboard)
    ? leaderboard.filter(e =>
        countryFilter === "All Countries" || e.country === countryFilter
      )
    : [];

  // Get unique countries from leaderboard
  const availableCountries = ["All Countries", ...Array.from(
    new Set(leaderboard.filter(e => e.country).map(e => e.country!))
  )];

  return (
    <section className="tab-content animate-in slide-in-from-left duration-300">
      <div className="mb-6">
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-1 border-l-4 border-[#FF6B00] pl-3">
          Performance Analytics
        </h2>
        <p className="text-gray-400 text-sm pl-4">{todayLabel}</p>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress" className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3" /> Progress
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
            <Target className="h-3 w-3" /> Overview
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1 text-xs">
            <Trophy className="h-3 w-3" /> Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* ── PROGRESS TAB ── */}
        <TabsContent value="progress" className="mt-6">
          <div className="flex justify-center mb-6">
            <div className="bg-[#1A1A1A] rounded-lg p-1 flex">
              <Button variant={chartView === 'daily' ? 'default' : 'ghost'} size="sm"
                onClick={() => setChartView('daily')}
                className={`px-6 ${chartView === 'daily' ? 'bg-[#FF6B00] text-black hover:bg-[#FF6B00]/90' : 'text-[#E0E0E0] hover:text-[#FF6B00] hover:bg-[#2A2A2A]'}`}>
                Daily
              </Button>
              <Button variant={chartView === 'weekly' ? 'default' : 'ghost'} size="sm"
                onClick={() => setChartView('weekly')}
                className={`px-6 ${chartView === 'weekly' ? 'bg-[#FF6B00] text-black hover:bg-[#FF6B00]/90' : 'text-[#E0E0E0] hover:text-[#FF6B00] hover:bg-[#2A2A2A]'}`}>
                Weekly
              </Button>
            </div>
          </div>

          {chartView === 'daily' ? (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-[#FF6B00]" />
                <span className="text-sm font-bold text-[#FF6B00] font-['Oswald']">TODAY — {todayLabel}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-[#000000] border-[#2A2A2A]">
                  <CardContent className="p-4 text-center">
                    <Activity className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                    <div className="text-2xl font-['Oswald'] font-bold text-white">{todayStats?.sessions ?? 0}</div>
                    <div className="text-xs text-gray-400">Sessions</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#000000] border-[#2A2A2A]">
                  <CardContent className="p-4 text-center">
                    <Flame className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                    <div className="text-2xl font-['Oswald'] font-bold text-white">{todayStats?.calories ?? 0}</div>
                    <div className="text-xs text-gray-400">Calories</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#000000] border-[#2A2A2A]">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                    <div className="text-2xl font-['Oswald'] font-bold text-white">{todayStats?.minutes ?? 0}</div>
                    <div className="text-xs text-gray-400">Minutes</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-[#FF6B00]" />
                <span className="text-sm font-bold text-[#FF6B00] font-['Oswald']">THIS WEEK</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-[#000000] border-[#2A2A2A]">
                  <CardContent className="p-4 text-center">
                    <Activity className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                    <div className="text-2xl font-['Oswald'] font-bold text-white">{weekStats?.sessions ?? 0}</div>
                    <div className="text-xs text-gray-400">Sessions</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#000000] border-[#2A2A2A]">
                  <CardContent className="p-4 text-center">
                    <Flame className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                    <div className="text-2xl font-['Oswald'] font-bold text-white">{weekStats?.calories ?? 0}</div>
                    <div className="text-xs text-gray-400">Calories</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#000000] border-[#2A2A2A]">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                    <div className="text-2xl font-['Oswald'] font-bold text-white">{weekStats?.hours ?? 0}</div>
                    <div className="text-xs text-gray-400">Hours</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <ProgressCharts userId={currentUserId} viewMode={chartView} />
        </TabsContent>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="bg-[#000000] border-[#2A2A2A]">
              <CardContent className="p-4 text-center">
                <Activity className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                <div className="text-2xl font-['Oswald'] font-bold text-white">{allTimeStats?.sessions ?? 0}</div>
                <div className="text-xs text-gray-400">All Workouts</div>
              </CardContent>
            </Card>
            <Card className="bg-[#000000] border-[#2A2A2A]">
              <CardContent className="p-4 text-center">
                <Flame className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                <div className="text-2xl font-['Oswald'] font-bold text-white">{allTimeStats?.calories ?? 0}</div>
                <div className="text-xs text-gray-400">Total Cals</div>
              </CardContent>
            </Card>
            <Card className="bg-[#000000] border-[#2A2A2A]">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-[#FF6B00] mx-auto mb-1" />
                <div className="text-2xl font-['Oswald'] font-bold text-white">{allTimeStats?.hours ?? 0}</div>
                <div className="text-xs text-gray-400">Total Hours</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#000000] border-[#2A2A2A] p-4 mb-6">
            <h3 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00] mb-4">Overall Level</h3>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-['Oswald'] text-2xl text-[#FF6B00]">Level {progression?.overallLevel || 0}</div>
                <div className="text-sm text-gray-400">{progression?.experience || 0} XP earned</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Next Level</div>
                <div className="font-bold text-white">{progression?.nextLevelXP || 100} XP</div>
              </div>
            </div>
            <div className="w-full bg-[#121212] h-3 rounded-full">
              <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF9E2C] h-3 rounded-full transition-all duration-500"
                style={{ width: `${progression?.progressToNext || 0}%` }} />
            </div>
            <div className="text-xs mt-2 text-center text-gray-500">{Math.round(progression?.progressToNext || 0)}% to next level</div>
          </Card>

          <Card className="bg-[#000000] border-[#2A2A2A] p-4 mb-6">
            <h3 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00] mb-4">Skill Levels</h3>
            <div className="space-y-4">
              <ProgressBar label="Explosive Power" level={progression?.explosivePowerLevel || 0} maxLevel={30} />
              <ProgressBar label="Opposite Foot" level={progression?.oppositeFootLevel || 0} maxLevel={30} />
              <ProgressBar label="Cardio Endurance" level={progression?.cardioLevel || 0} maxLevel={30} />
              <ProgressBar label="Physical Strength" level={progression?.strengthLevel || 0} maxLevel={30} />
              <ProgressBar label="Upper Body" level={progression?.upperBodyLevel || 0} maxLevel={30} />
              <ProgressBar label="Lower Body" level={progression?.lowerBodyLevel || 0} maxLevel={30} />
            </div>
          </Card>

          {statsSummary?.dailyBreakdown && (
            <Card className="bg-[#000000] border-[#2A2A2A] p-4">
              <h3 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00] mb-4">Last 7 Days</h3>
              <div className="grid grid-cols-7 gap-1">
                {statsSummary.dailyBreakdown.map((day) => {
                  const isToday = day.date === new Date().toISOString().split('T')[0];
                  return (
                    <div key={day.date} className={`text-center p-2 rounded-lg ${isToday ? 'bg-[#FF6B00]/20 border border-[#FF6B00]/50' : 'bg-[#1A1A1A]'}`}>
                      <div className="text-xs text-gray-400 mb-1">{day.label}</div>
                      <div className={`text-sm font-bold font-['Oswald'] ${day.sessions > 0 ? 'text-[#FF6B00]' : 'text-gray-600'}`}>{day.sessions}</div>
                      <div className="text-xs text-gray-500">{day.sessions > 0 ? `${day.calories}c` : '—'}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">Sessions per day • calories shown below</p>
            </Card>
          )}
        </TabsContent>

        {/* ── LEADERBOARD TAB ── */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card className="bg-[#000000] border-[#2A2A2A] p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm">Your Score</div>
                <div className="font-['Oswald'] text-2xl text-[#FF6B00]">{userScore?.score ?? 0} pts</div>
              </div>
              <Trophy className="h-8 w-8 text-[#FF6B00] opacity-60" />
            </div>
          </Card>

          {/* Country Filter */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-[#FF6B00]" />
              <span className="text-sm text-gray-400 font-['Oswald']">Filter by Country</span>
            </div>
            <div className="flex overflow-x-auto gap-2 pb-2">
              {availableCountries.map(c => (
                <button key={c} onClick={() => setCountryFilter(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${countryFilter === c ? "bg-[#FF6B00] text-black" : "bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {countryFilter !== "All Countries" && (
            <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Showing players from {countryFilter} — {filteredLeaderboard.length} player{filteredLeaderboard.length !== 1 ? "s" : ""}
            </div>
          )}

          <div className="space-y-2">
            {filteredLeaderboard.slice(0, 20).map((entry, index) => (
              <Card key={entry.id} className={`border-[#2A2A2A] p-4 ${entry.userId === currentUserId ? 'bg-[#FF6B00]/10 border-[#FF6B00]/40' : 'bg-[#000000]'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-['Oswald'] font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-amber-600 text-black' :
                    'bg-[#2A2A2A] text-white'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white">{entry.fullName || entry.username || "Player"}</div>
                    <div className="text-xs text-gray-400">
                      @{entry.username}{entry.country ? ` · ${entry.country}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-['Oswald'] text-[#FF6B00] font-bold">{entry.totalScore.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">pts</div>
                  </div>
                </div>
              </Card>
            ))}
            {filteredLeaderboard.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>{countryFilter === "All Countries" ? "No rankings yet. Complete workouts to rank up!" : `No players from ${countryFilter} yet.`}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default Stats;
