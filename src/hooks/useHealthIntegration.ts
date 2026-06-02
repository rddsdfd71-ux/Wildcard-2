import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface HealthData {
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  heartRate?: number;
  lastUpdated: Date;
  source: 'google-fit' | 'apple-health' | 'web-api' | 'manual';
}

export interface HealthPermissions {
  steps: boolean;
  calories: boolean;
  heartRate: boolean;
  location: boolean;
}

export interface WeeklyStepData {
  date: string;
  steps: number;
}

export function useHealthIntegration(userId: number) {
  const queryClient = useQueryClient();

  // Check health permissions
  const permissions = useQuery<HealthPermissions>({
    queryKey: ["/api/users", userId, "health/permissions"],
    staleTime: 300000, // 5 minutes
  });

  // Get current health data
  const healthData = useQuery<HealthData>({
    queryKey: ["/api/users", userId, "health/data"],
    refetchInterval: 60000, // Refresh every minute
    enabled: permissions.data?.steps === true,
  });

  // Get weekly step summary
  const weeklySteps = useQuery<WeeklyStepData[]>({
    queryKey: ["/api/users", userId, "health/steps/weekly"],
    staleTime: 300000, // 5 minutes
    enabled: permissions.data?.steps === true,
  });

  // Initialize health data connection
  const initHealthMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/users/${userId}/health/init`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "health"] });
    }
  });

  // Set step goal
  const setStepGoalMutation = useMutation({
    mutationFn: async (goal: number) => {
      return apiRequest(`/api/users/${userId}/health/steps/goal`, "POST", { goal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "health/data"] });
    }
  });

  // Add manual steps (from workouts)
  const addStepsMutation = useMutation({
    mutationFn: async (steps: number) => {
      return apiRequest(`/api/users/${userId}/health/steps/add`, "POST", { steps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "health/data"] });
    }
  });

  // Request health permissions
  const requestPermissionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/users/${userId}/health/permissions`, "GET");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "health/permissions"] });
    }
  });

  return {
    // Data
    healthData: healthData.data,
    permissions: permissions.data,
    weeklySteps: weeklySteps.data,
    
    // Loading states
    isLoading: healthData.isLoading || permissions.isLoading,
    isLoadingWeekly: weeklySteps.isLoading,
    
    // Mutations
    initHealth: initHealthMutation.mutate,
    setStepGoal: setStepGoalMutation.mutate,
    addSteps: addStepsMutation.mutate,
    requestPermissions: requestPermissionsMutation.mutate,
    
    // Mutation states
    isInitializing: initHealthMutation.isPending,
    isSettingGoal: setStepGoalMutation.isPending,
    isAddingSteps: addStepsMutation.isPending,
    isRequestingPermissions: requestPermissionsMutation.isPending,
    
    // Health connection status
    isConnected: healthData.data?.source !== 'manual',
    hasPermissions: permissions.data?.steps === true,
    
    // Helpers
    getStepProgress: () => {
      if (!healthData.data) return 0;
      const goal = 12000; // Default goal, should come from user settings
      return Math.min(100, (healthData.data.steps / goal) * 100);
    },
    
    getCaloriesBurned: () => healthData.data?.calories || 0,
    getDistanceWalked: () => healthData.data?.distance || 0,
    getActiveMinutes: () => healthData.data?.activeMinutes || 0,
    
    getHealthSource: () => {
      switch (healthData.data?.source) {
        case 'google-fit':
          return 'Google Fit';
        case 'apple-health':
          return 'Apple Health';
        case 'web-api':
          return 'Device Sensors';
        default:
          return 'Manual Entry';
      }
    }
  };
}