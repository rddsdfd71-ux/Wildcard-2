import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface StepData {
  totalSteps: number;
  dailySteps: number;
  goal: number;
  progressPercentage: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  hourlySteps: { hour: number; steps: number }[];
}

export interface HeartRateData {
  current: number;
  resting: number;
  zones: {
    zone: string;
    range: [number, number];
    minutes: number;
  }[];
  last24Hours: { time: string; bpm: number }[];
}

export function useStepTracking(userId: number) {
  const queryClient = useQueryClient();

  const stepData = useQuery<StepData>({
    queryKey: ["/api/users", userId, "steps"],
    refetchInterval: 30000, // Refresh every 30 seconds like real fitness trackers
  });

  const heartRateData = useQuery<HeartRateData>({
    queryKey: ["/api/users", userId, "heart-rate"],
    refetchInterval: 30000,
  });

  const addStepsMutation = useMutation({
    mutationFn: async (steps: number) => {
      return apiRequest(`/api/users/${userId}/steps/add`, "POST", { steps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "steps"] });
    }
  });

  const setStepGoalMutation = useMutation({
    mutationFn: async (goal: number) => {
      return apiRequest(`/api/users/${userId}/step-goal`, "POST", { goal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "steps"] });
    }
  });

  return {
    stepData: stepData.data,
    heartRateData: heartRateData.data,
    isLoading: stepData.isLoading || heartRateData.isLoading,
    addSteps: addStepsMutation.mutate,
    setStepGoal: setStepGoalMutation.mutate,
    isAddingSteps: addStepsMutation.isPending,
    isSettingGoal: setStepGoalMutation.isPending
  };
}