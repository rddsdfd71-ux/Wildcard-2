// Simplified data management without context
import { TabType, WeeklyProgress, HealthMetrics, UserTrainingStats } from "@/lib/types";
import { initialHealthMetrics, initialUserStats, initialWeeklyProgress } from "@/data/initialData";

// Single central state store for the app
let currentTabState: TabType = "dashboard";
let weeklyProgressState: WeeklyProgress = initialWeeklyProgress;
let healthMetricsState: HealthMetrics = initialHealthMetrics;
let userStatsState: UserTrainingStats = initialUserStats;
let isLoadingState: boolean = false;

// Functions to update state
const setCurrentTab = (tab: TabType) => {
  currentTabState = tab;
};

const updateHealthMetrics = (metrics: Partial<HealthMetrics>) => {
  healthMetricsState = {
    ...healthMetricsState,
    ...metrics,
  };
};

const completeWorkout = async (workoutId: number) => {
  try {
    // Update weekly progress
    weeklyProgressState = {
      ...weeklyProgressState,
      completed: Math.min(weeklyProgressState.completed + 1, weeklyProgressState.weeklyGoal),
    };
  } catch (error) {
    console.error("Failed to complete workout:", error);
  }
};

// Expose data and functions
export function useAppState() {
  return {
    currentTab: currentTabState,
    setCurrentTab,
    weeklyProgress: weeklyProgressState,
    healthMetrics: healthMetricsState,
    userStats: userStatsState,
    isLoading: isLoadingState,
    completeWorkout,
    updateHealthMetrics
  };
}

// Empty placeholder to keep imports working
export function AppStateProvider({ children }: any) {
  return children;
}
