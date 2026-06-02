import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { progressStorage } from '@/lib/progressStorage';

export interface WorkoutTimerState {
  isActive: boolean;
  timeRemaining: number; // in seconds
  totalDuration: number; // in seconds
  progress: number; // percentage 0-100
  canFinish: boolean;
  sessionId?: number;
  workoutId?: number;
  startTime?: Date;
}

export interface UseWorkoutTimerReturn {
  timerState: WorkoutTimerState;
  startWorkout: (workoutId: number, workoutName: string, durationMinutes: number, difficulty: string) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  formatTime: (seconds: number) => string;
  isLoading: boolean;
}

export function useWorkoutTimer(userId: number): UseWorkoutTimerReturn {
  const [timerState, setTimerState] = useState<WorkoutTimerState>({
    isActive: false,
    timeRemaining: 0,
    totalDuration: 0,
    progress: 0,
    canFinish: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create workout session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      console.log("Creating session with data:", sessionData);
      console.log("User ID:", userId);
      const response = await apiRequest('POST', `/api/users/${userId}/workout-sessions`, sessionData);
      const result = await response.json();
      console.log("Session created successfully:", result);
      return result;
    },
    onError: (error) => {
      console.error("Session creation failed:", error);
    }
  });

  // Complete workout session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/workout-sessions/${sessionId}/complete`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/workout-sessions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/stats/summary`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-stats/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "progression"] });
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState.isActive && timerState.timeRemaining > 0) {
      interval = setInterval(() => {
        setTimerState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          const progress = ((prev.totalDuration - newTimeRemaining) / prev.totalDuration) * 100;
          
          // Allow finishing when 90% complete (to account for early completion)
          const canFinish = progress >= 90;
          
          if (newTimeRemaining <= 0) {
            // Workout time complete
            toast({
              title: "🏃‍♂️ Workout Time Complete!",
              description: "Great job! You can now finish your workout.",
            });
            
            return {
              ...prev,
              timeRemaining: 0,
              progress: 100,
              canFinish: true,
              isActive: false,
            };
          }

          return {
            ...prev,
            timeRemaining: newTimeRemaining,
            progress,
            canFinish,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerState.isActive, timerState.timeRemaining, toast]);

  const startWorkout = useCallback(async (workoutId: number, workoutName: string, durationMinutes: number, difficulty: string) => {
    try {
      // Create workout session in database - match the schema exactly
      const sessionData = {
        workoutId,
        difficulty,
        totalDuration: durationMinutes * 60, // duration in seconds
        completed: false,
      };
      
      const session = await createSessionMutation.mutateAsync(sessionData);
      
      const durationSeconds = durationMinutes * 60;
      setTimerState({
        isActive: true,
        timeRemaining: durationSeconds,
        totalDuration: durationSeconds,
        progress: 0,
        canFinish: false,
        sessionId: session?.id || Math.floor(Date.now() / 1000), // fallback to timestamp if no id
        workoutId,
        startTime: new Date(),
      });
      
      toast({
        title: "Workout Started!",
        description: `Timer set for ${durationMinutes} minutes. Give it your all!`,
      });
    } catch (error) {
      console.error("Workout start error:", error);
      toast({
        title: "Error",
        description: `Failed to start workout session: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    }
  }, [createSessionMutation, toast]);

  const finishWorkout = useCallback(async () => {
    if (!timerState.canFinish) {
      toast({
        title: "Not quite yet!",
        description: "Complete at least 90% of your workout before finishing.",
        variant: "destructive",
      });
      return;
    }

    if (!timerState.sessionId || !timerState.startTime) {
      toast({
        title: "Error",
        description: "No active workout session found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const actualDuration = Math.round((Date.now() - timerState.startTime.getTime()) / 1000);
      const estimatedCalories = Math.round((actualDuration / 60) * 8); // ~8 calories per minute
      const estimatedHeartRate = 140; // average workout heart rate
      const estimatedXP = Math.floor(actualDuration / 60) * 15; // Base XP per minute

      // Save progress locally to ensure persistence
      const workoutProgress = {
        id: `workout_${Date.now()}`,
        userId: userId,
        workoutName: `Workout ${timerState.workoutId || 'Session'}`,
        workoutId: timerState.workoutId || 0,
        duration: actualDuration,
        calories: estimatedCalories,
        heartRate: estimatedHeartRate,
        completedAt: new Date().toISOString(),
        xpGained: estimatedXP,
        difficulty: 'intermediate' // Default difficulty
      };

      // Save to local storage immediately (prevents data loss)
      progressStorage.saveCompletedWorkout(workoutProgress);

      // Try to save to server and update progression
      try {
        await completeSessionMutation.mutateAsync({
          sessionId: timerState.sessionId,
          data: {
            duration: actualDuration,
            calories: estimatedCalories,
            heartRate: estimatedHeartRate,
          },
        });

        // Also call the progression API to update XP and levels
        try {
          const progressionResponse = await apiRequest('POST', `/api/users/${userId}/complete-workout`, {
            workoutType: `Workout ${timerState.workoutId || 'Session'}`,
            duration: actualDuration,
            difficulty: 'intermediate',
            exercises: 5, // Default exercise count
            performanceRating: 8, // Good performance rating
          });
          
          const progressionData = await progressionResponse.json();
          console.log('Progression updated:', progressionData);
          
          // Show level up notification if there were rewards
          if (progressionData.rewards && progressionData.rewards.length > 0) {
            toast({
              title: "🎉 Level Up!",
              description: `${progressionData.message} - ${progressionData.rewards.length} skills improved!`,
            });
          }
        } catch (progressionError) {
          console.warn('Progression update failed:', progressionError);
        }
      } catch (serverError) {
        console.warn('Server save failed, but progress saved locally:', serverError);
      }

      setTimerState({
        isActive: false,
        timeRemaining: 0,
        totalDuration: 0,
        progress: 100,
        canFinish: false,
      });

      toast({
        title: "Workout Completed!",
        description: `Excellent work! Gained ${estimatedXP} XP and burned ${estimatedCalories} calories. Progress saved!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete workout. Please try again.",
        variant: "destructive",
      });
    }
  }, [timerState.canFinish, timerState.sessionId, timerState.startTime, completeSessionMutation, toast]);

  const cancelWorkout = useCallback(() => {
    setTimerState({
      isActive: false,
      timeRemaining: 0,
      totalDuration: 0,
      progress: 0,
      canFinish: false,
    });
    
    toast({
      title: "Workout Cancelled",
      description: "No progress recorded. Try again when you're ready!",
    });
  }, [toast]);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    timerState,
    startWorkout,
    finishWorkout,
    cancelWorkout,
    formatTime,
    isLoading: createSessionMutation.isPending || completeSessionMutation.isPending,
  };
}