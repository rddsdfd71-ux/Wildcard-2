import { useQuery } from "@tanstack/react-query";

export interface DayBreakdown {
  day: string;
  dayShort: string;
  sessions: number;
  date: string;
}

export interface WeeklyProgressData {
  completed: number;
  weeklyGoal: number;
  progressPercentage: number;
  dailyBreakdown: DayBreakdown[];
}

export function useWeeklyProgress(userId: number) {
  const { data: weeklyProgress, isLoading, error } = useQuery({
    queryKey: ["/api/users", userId, "weekly-progress"],
    enabled: !!userId,
  });

  return {
    weeklyProgress: weeklyProgress as WeeklyProgressData,
    isLoading,
    error
  };
}