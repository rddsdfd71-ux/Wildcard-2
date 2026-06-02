/**
 * Client-side progress storage for persistent workout data
 * Ensures user progress persists even if server storage fails
 */

export interface WorkoutProgress {
  id: string;
  userId: number;
  workoutName: string;
  workoutId: number;
  duration: number; // in seconds
  calories: number;
  heartRate: number;
  completedAt: string; // ISO date string
  xpGained: number;
  difficulty: string;
}

export interface UserProgressSummary {
  totalWorkouts: number;
  totalDuration: number; // in seconds
  totalCalories: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: number;
  level: number;
  experience: number;
  lastWorkoutDate: string;
  workoutHistory: WorkoutProgress[];
}

class ProgressStorage {
  private readonly STORAGE_KEY = 'wild_card_progress';
  private readonly USER_PROGRESS_KEY = 'wild_card_user_progress';

  // Save completed workout to localStorage
  saveCompletedWorkout(progress: WorkoutProgress): void {
    try {
      const existingProgress = this.getAllWorkoutProgress();
      existingProgress.push(progress);
      
      // Keep only last 100 workouts to prevent storage bloat
      const recentProgress = existingProgress.slice(-100);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentProgress));
      this.updateUserProgressSummary(progress);
      
      console.log('Workout progress saved locally:', progress);
    } catch (error) {
      console.error('Failed to save workout progress:', error);
    }
  }

  // Get all workout progress from localStorage
  getAllWorkoutProgress(): WorkoutProgress[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load workout progress:', error);
      return [];
    }
  }

  // Get progress for a specific time period
  getProgressByDateRange(startDate: Date, endDate: Date): WorkoutProgress[] {
    const allProgress = this.getAllWorkoutProgress();
    return allProgress.filter(progress => {
      const workoutDate = new Date(progress.completedAt);
      return workoutDate >= startDate && workoutDate <= endDate;
    });
  }

  // Update user progress summary
  private updateUserProgressSummary(newWorkout: WorkoutProgress): void {
    try {
      const summary = this.getUserProgressSummary();
      const allWorkouts = this.getAllWorkoutProgress();
      
      // Update totals
      summary.totalWorkouts = allWorkouts.length;
      summary.totalDuration = allWorkouts.reduce((total, w) => total + w.duration, 0);
      summary.totalCalories = allWorkouts.reduce((total, w) => total + w.calories, 0);
      summary.lastWorkoutDate = newWorkout.completedAt;
      summary.workoutHistory = allWorkouts.slice(-10); // Keep last 10 for quick access

      // Calculate streak
      summary.currentStreak = this.calculateCurrentStreak(allWorkouts);
      summary.longestStreak = Math.max(summary.longestStreak, summary.currentStreak);

      // Calculate weekly progress (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyWorkouts = this.getProgressByDateRange(weekAgo, new Date());
      summary.weeklyProgress = Math.min(100, (weeklyWorkouts.length / 5) * 100); // 5 workouts = 100%

      // Update experience and level
      summary.experience += newWorkout.xpGained;
      summary.level = this.calculateLevel(summary.experience);

      localStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(summary));
    } catch (error) {
      console.error('Failed to update user progress summary:', error);
    }
  }

  // Get user progress summary
  getUserProgressSummary(): UserProgressSummary {
    try {
      const stored = localStorage.getItem(this.USER_PROGRESS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user progress summary:', error);
    }

    // Return default summary if none exists
    return {
      totalWorkouts: 0,
      totalDuration: 0,
      totalCalories: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyProgress: 0,
      level: 1,
      experience: 0,
      lastWorkoutDate: '',
      workoutHistory: []
    };
  }

  // Calculate current workout streak
  private calculateCurrentStreak(workouts: WorkoutProgress[]): number {
    if (workouts.length === 0) return 0;

    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workouts].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check each day backwards from today
    for (let i = 0; i < 30; i++) { // Check last 30 days max
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasWorkoutOnDate = sortedWorkouts.some(workout => {
        const workoutDate = new Date(workout.completedAt);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });

      if (hasWorkoutOnDate) {
        streak++;
      } else if (streak > 0) {
        // Break streak if no workout found and we already have a streak
        break;
      }
    }

    return streak;
  }

  // Calculate user level based on experience
  private calculateLevel(experience: number): number {
    const levels = [
      0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250,
      3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, 11500,
      12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200, 24750
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (experience >= levels[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // Clear all progress (for testing or reset)
  clearAllProgress(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.USER_PROGRESS_KEY);
      console.log('All workout progress cleared');
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }

  // Export progress for backup or server sync
  exportProgress(): { workouts: WorkoutProgress[], summary: UserProgressSummary } {
    return {
      workouts: this.getAllWorkoutProgress(),
      summary: this.getUserProgressSummary()
    };
  }
}

export const progressStorage = new ProgressStorage();