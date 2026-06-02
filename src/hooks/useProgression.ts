import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ProgressionData {
  explosivePowerLevel: number;
  oppositeFootLevel: number;
  cardioLevel: number;
  strengthLevel: number;
  upperBodyLevel: number;
  lowerBodyLevel: number;
  overallLevel: number;
  experience: number;
  nextLevelXP: number;
  progressToNext: number;
}

export interface LevelUpReward {
  level: number;
  category: string;
  xpGained: number;
  unlocks: string[];
  message: string;
}

export interface WorkoutCompletionResponse {
  progression: ProgressionData;
  rewards: LevelUpReward[];
  message: string;
  levelUps: number;
}


export function useProgression(userId: number) {
  const queryClient = useQueryClient();

  const progressionData = useQuery<ProgressionData>({
    queryKey: ["/api/users", userId, "progression"],
    refetchInterval: 60000, // Refresh every minute
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: async (workoutData: {
      workoutType: string;
      duration: number;
      difficulty: string;
      exercises?: number;
      performanceRating?: number;
    }): Promise<WorkoutCompletionResponse> => {
      const response = await apiRequest("POST", `/api/users/${userId}/complete-workout`, workoutData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "progression"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "steps"] });
    },
    onError: (error) => {
      console.error("Failed to complete workout:", error);
    }
  });

  return {
    progression: progressionData.data,
    isLoading: progressionData.isLoading,
    completeWorkout: completeWorkoutMutation.mutate,
    isCompletingWorkout: completeWorkoutMutation.isPending,
    workoutResult: completeWorkoutMutation.data,
  };
}