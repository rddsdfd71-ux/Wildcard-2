// App-specific types for frontend use

export type TabType = "dashboard" | "training" | "techniques" | "stats" | "valuation" | "position" | "settings";

// Progress types
export type DailyProgress = {
  day: string;
  intensity: number;
};

export type WeeklyProgress = {
  dailyProgress: DailyProgress[];
  weeklyGoal: number;
  completed: number;
};

// Training types
export type TrainingCardProps = {
  id: number;
  name: string;
  description: string;
  workoutsPerWeek: number;
  focusArea: string;
  icon: string;
};

export type WorkoutItemProps = {
  id: number;
  name: string;
  sets: number;
  reps: number;
  order: number;
  onPlay: () => void;
};

// Technique types
export type TechniqueCardProps = {
  id: number;
  name: string;
  description: string;
  icon: string;
  tag?: string;
  category: string;
  hasVideo?: boolean;
};

export type VideoTutorialProps = {
  videoId: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
};

// Nutrition types
export type MealCardProps = {
  title: string;
  description: string;
  icon: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  type: string;
};

// Stats types
export type StatsBarProps = {
  label: string;
  level: number;
  maxLevel: number;
};

export type ActivityItemProps = {
  day: string;
  activity: string;
  duration: string;
  completed: boolean;
  isToday?: boolean;
  isRest?: boolean;
};

// Health metrics
export type HealthMetrics = {
  heartRate: number;
  steps: number;
  stepsGoal: number;
};

// User stats
export type UserTrainingStats = {
  explosivePower: {
    level: number;
    progress: number;
  };
  oppositeFootTechnique: {
    level: number;
    progress: number;
  };
  cardioEndurance: {
    level: number;
    progress: number;
  };
  physicalStrength: {
    level: number;
    progress: number;
  };
};
