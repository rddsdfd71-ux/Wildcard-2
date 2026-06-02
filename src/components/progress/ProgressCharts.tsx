import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, TrendingUp, Activity, Target, Trophy, Flame } from 'lucide-react';
import { progressStorage } from '@/lib/progressStorage';

interface ProgressData {
  daily: Array<{
    day: string;
    workouts: number;
    calories: number;
    duration: number;
    xpGained: number;
  }>;
  weekly: Array<{
    week: string;
    workouts: number;
    calories: number;
    duration: number;
    xpGained: number;
  }>;
  monthly: Array<{
    month: string;
    totalWorkouts: number;
    totalCalories: number;
    totalDuration: number;
    avgHeartRate: number;
  }>;
  recentSessions: Array<{
    id: number;
    workoutName: string;
    date: string;
    duration: number;
    calories: number;
    difficulty: string;
  }>;
  stats: {
    totalSessions: number;
    totalCalories: number;
    totalHours: number;
    currentStreak: number;
    favoriteWorkout: string;
    avgDuration: number;
  };
}

interface ProgressChartsProps {
  userId: number;
  viewMode?: 'daily' | 'weekly';
}

export default function ProgressCharts({ userId, viewMode = 'weekly' }: ProgressChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [localProgressData, setLocalProgressData] = useState<ProgressData | null>(null);

  const processDailyData = (workoutHistory: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    
    return days.map((day, index) => {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - (6 - index));
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      const daySessions = workoutHistory.filter((workout: any) => {
        const workoutDate = new Date(workout.completedAt);
        return workoutDate >= dayStart && workoutDate <= dayEnd;
      });

      return {
        day,
        workouts: daySessions.length,
        calories: daySessions.reduce((sum: number, w: any) => sum + (w.calories || 0), 0),
        duration: Math.round(daySessions.reduce((sum: number, w: any) => sum + (w.duration || 0), 0) / 60),
        xpGained: daySessions.length * 50, // 50 XP per workout
      };
    });
  };

  const processWeeklyData = (workoutHistory: any[]) => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const now = new Date();
    
    return weeks.map((week, index) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (4 - index) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekSessions = workoutHistory.filter((workout: any) => {
        const workoutDate = new Date(workout.completedAt);
        return workoutDate >= weekStart && workoutDate < weekEnd;
      });

      return {
        week,
        workouts: weekSessions.length,
        calories: weekSessions.reduce((sum: number, w: any) => sum + (w.calories || 0), 0),
        duration: Math.round(weekSessions.reduce((sum: number, w: any) => sum + (w.duration || 0), 0) / 60),
        xpGained: weekSessions.length * 50, // 50 XP per workout
      };
    });
  };

  const processMonthlyData = (workoutHistory: any[]) => {
    const months = ['Jan', 'Feb', 'Mar'];
    const now = new Date();
    
    return months.map((month, index) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (3 - index), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - (3 - index) + 1, 0);

      const monthSessions = workoutHistory.filter((workout: any) => {
        const workoutDate = new Date(workout.completedAt);
        return workoutDate >= monthStart && workoutDate <= monthEnd;
      });

      return {
        month,
        totalWorkouts: monthSessions.length,
        totalCalories: monthSessions.reduce((sum: number, w: any) => sum + (w.calories || 0), 0),
        totalDuration: Math.round(monthSessions.reduce((sum: number, w: any) => sum + (w.duration || 0), 0) / 60),
        avgHeartRate: monthSessions.length > 0 
          ? Math.round(monthSessions.reduce((sum: number, w: any) => sum + (w.heartRate || 140), 0) / monthSessions.length)
          : 0,
      };
    });
  };

  // Load progress data from local storage on component mount
  useEffect(() => {
    const loadLocalProgress = () => {
      const workoutHistory = progressStorage.getAllWorkoutProgress();
      const userSummary = progressStorage.getUserProgressSummary();
      
      if (workoutHistory.length === 0) {
        setLocalProgressData({
          daily: [],
          weekly: [],
          monthly: [],
          recentSessions: [],
          stats: {
            totalSessions: 0,
            totalCalories: 0,
            totalHours: 0,
            currentStreak: 0,
            favoriteWorkout: 'No workouts yet',
            avgDuration: 0,
          },
        });
        return;
      }

      // Process local data for charts
      const dailyData = processDailyData(workoutHistory);
      const weeklyData = processWeeklyData(workoutHistory);
      const monthlyData = processMonthlyData(workoutHistory);
      const recentSessions = workoutHistory.slice(-5).map((workout, index) => ({
        id: index,
        workoutName: workout.workoutName,
        date: new Date(workout.completedAt).toLocaleDateString(),
        duration: Math.round(workout.duration / 60),
        calories: workout.calories,
        difficulty: workout.difficulty,
      }));

      const stats = {
        totalSessions: userSummary.totalWorkouts,
        totalCalories: userSummary.totalCalories,
        totalHours: Math.round(userSummary.totalDuration / 3600 * 10) / 10,
        currentStreak: userSummary.currentStreak,
        favoriteWorkout: 'Training Session',
        avgDuration: userSummary.totalWorkouts > 0 ? Math.round(userSummary.totalDuration / userSummary.totalWorkouts / 60) : 0,
      };

      setLocalProgressData({
        daily: dailyData,
        weekly: weeklyData,
        monthly: monthlyData,
        recentSessions,
        stats,
      });
    };

    loadLocalProgress();
  }, []);

  // Fetch real session data from DB
  const { data: workoutSessions } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/workout-sessions`],
    enabled: !!userId,
    staleTime: 30000,
  });

  // When DB sessions load, override local data with real data
  useEffect(() => {
    if (workoutSessions && Array.isArray(workoutSessions) && workoutSessions.length > 0) {
      const completed = workoutSessions.filter((s: any) => s.completed);
      const dailyData = processDailyData(completed.map((s: any) => ({
        completedAt: s.startTime,
        calories: s.burnedCalories || 0,
        duration: s.totalDuration || 0,
        difficulty: 'medium',
        workoutName: s.workoutName || 'Training Session',
      })));
      const weeklyData = processWeeklyData(completed.map((s: any) => ({
        completedAt: s.startTime,
        calories: s.burnedCalories || 0,
        duration: s.totalDuration || 0,
      })));
      const monthlyData = processMonthlyData(completed.map((s: any) => ({
        completedAt: s.startTime,
        calories: s.burnedCalories || 0,
        duration: s.totalDuration || 0,
      })));
      const recentSessions = completed.slice(-5).reverse().map((s: any, i: number) => ({
        id: i,
        workoutName: s.workoutName || 'Training Session',
        date: new Date(s.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        duration: Math.round((s.totalDuration || 0) / 60),
        calories: s.burnedCalories || 0,
        difficulty: 'medium',
      }));
      const dbStats = calculateStats(completed.map((s: any) => ({
        ...s,
        calories: s.burnedCalories,
        duration: s.totalDuration,
      })));
      setLocalProgressData({ daily: dailyData, weekly: weeklyData, monthly: monthlyData, recentSessions, stats: dbStats });
    }
  }, [workoutSessions]);

  const isLoading = !localProgressData;

  const calculateStats = (sessions: any[]) => {
    const totalSessions = sessions.length;
    const totalCalories = sessions.reduce((sum: number, s: any) => sum + (s.calories || 0), 0);
    const totalDuration = sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
    const totalHours = Math.round((totalDuration / 3600) * 10) / 10;
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60) : 0;

    // Calculate current streak
    const sortedSessions = sessions
      .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    let currentStreak = 0;
    let lastDate = new Date();
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime);
      const daysDiff = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        currentStreak++;
        lastDate = sessionDate;
      } else {
        break;
      }
    }

    // Find favorite workout type
    const workoutCounts: { [key: string]: number } = {};
    sessions.forEach((session: any) => {
      const name = session.workoutName || 'Training Session';
      workoutCounts[name] = (workoutCounts[name] || 0) + 1;
    });
    
    const favoriteWorkout = Object.entries(workoutCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';

    return {
      totalSessions,
      totalCalories,
      totalHours,
      currentStreak,
      favoriteWorkout,
      avgDuration,
    };
  };

  const progressData = localProgressData || {
    daily: [],
    weekly: [],
    monthly: [],
    recentSessions: [],
    stats: {
      totalSessions: 0,
      totalCalories: 0,
      totalHours: 0,
      currentStreak: 0,
      favoriteWorkout: 'No workouts yet',
      avgDuration: 0,
    },
  };

  const workoutTypeData = [
    { name: 'Sprint Training', value: 35, color: '#FF6B1A' },
    { name: 'Ball Control', value: 25, color: '#FF8C42' },
    { name: 'Strength Training', value: 20, color: '#FFA663' },
    { name: 'Agility Drills', value: 20, color: '#FFB885' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              +{progressData.weekly[progressData.weekly.length - 1]?.workouts || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
            <Flame className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.stats.totalCalories.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{progressData.weekly[progressData.weekly.length - 1]?.calories || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Hours</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.stats.totalHours}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((progressData.weekly[progressData.weekly.length - 1]?.duration || 0) / 60)} hours this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'weekly' | 'monthly')}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{viewMode === 'daily' ? 'Daily Workouts' : 'Weekly Workouts'}</CardTitle>
                <CardDescription>Number of completed training sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={viewMode === 'daily' ? progressData.daily : progressData.weekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={viewMode === 'daily' ? 'day' : 'week'} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="workouts" fill="#FF6B1A" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{viewMode === 'daily' ? 'Daily Calories' : 'Weekly Calories'}</CardTitle>
                <CardDescription>Calories burned during training</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewMode === 'daily' ? progressData.daily : progressData.weekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={viewMode === 'daily' ? 'day' : 'week'} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="calories" stroke="#FF6B1A" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Duration</CardTitle>
                <CardDescription>{viewMode === 'daily' ? 'Total minutes trained per day' : 'Total minutes trained per week'}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={viewMode === 'daily' ? progressData.daily : progressData.weekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={viewMode === 'daily' ? 'day' : 'week'} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="duration" fill="#FF8C42" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>XP Progress</CardTitle>
                <CardDescription>{viewMode === 'daily' ? 'Experience points gained each day' : 'Experience points gained each week'}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewMode === 'daily' ? progressData.daily : progressData.weekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={viewMode === 'daily' ? 'day' : 'week'} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="xpGained" stroke="#FFA663" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Workouts</CardTitle>
                <CardDescription>Total sessions completed each month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalWorkouts" fill="#FF6B1A" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Calories</CardTitle>
                <CardDescription>Total calories burned each month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalCalories" stroke="#FF6B1A" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Duration</CardTitle>
                <CardDescription>Total training time each month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalDuration" fill="#FF8C42" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Heart Rate</CardTitle>
                <CardDescription>Monthly average heart rate during workouts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[120, 160]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgHeartRate" stroke="#FFA663" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Workout Type Distribution and Recent Sessions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workout Distribution</CardTitle>
            <CardDescription>Your training focus areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workoutTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {workoutTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your latest training activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.recentSessions.length > 0 ? (
                progressData.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{session.workoutName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {session.date} • {session.duration} min • {session.calories} cal
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.difficulty === 'High' ? 'bg-red-100 text-red-800' :
                      session.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {session.difficulty}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No workout sessions yet</p>
                  <p className="text-sm">Start training to see your progress!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}