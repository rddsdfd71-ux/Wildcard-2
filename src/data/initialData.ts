import { WeeklyProgress, HealthMetrics, UserTrainingStats } from "@/lib/types";

// Initial health metrics
export const initialHealthMetrics: HealthMetrics = {
  heartRate: 72,
  steps: 8451,
  stepsGoal: 12000,
};

// Initial user training stats
export const initialUserStats: UserTrainingStats = {
  explosivePower: {
    level: 5,
    progress: 65,
  },
  oppositeFootTechnique: {
    level: 3,
    progress: 45,
  },
  cardioEndurance: {
    level: 6,
    progress: 75,
  },
  physicalStrength: {
    level: 4,
    progress: 55,
  }
};

// Initial weekly progress
export const initialWeeklyProgress: WeeklyProgress = {
  dailyProgress: [
    { day: "Mon", intensity: 60 },
    { day: "Tue", intensity: 80 },
    { day: "Wed", intensity: 65 },
    { day: "Thu", intensity: 90 },
    { day: "Fri", intensity: 75 },
    { day: "Sat", intensity: 50 },
    { day: "Sun", intensity: 30 },
  ],
  weeklyGoal: 7,
  completed: 5,
};

// Today's activities
export const todayActivities = [
  {
    id: 1,
    name: "Explosive Lower Body",
    description: "Focus on building explosive power in your legs",
    duration: "45 mins",
    intensity: "High Intensity",
    type: "workout",
    icon: "bolt",
  },
  {
    id: 2,
    name: "Opposite Foot Shooting Drills",
    description: "Practice shooting with your weaker foot",
    duration: "30 mins",
    intensity: "Technique Focus",
    type: "technique",
    icon: "futbol",
  },
  {
    id: 3,
    name: "Recovery Meal Plan",
    description: "Post-workout nutrition",
    duration: "",
    intensity: "",
    type: "nutrition",
    icon: "apple-alt",
  },
];

// Weekly activity
export const weeklyActivity = [
  {
    day: "M",
    activity: "Explosive Training",
    duration: "45 min",
    completed: true,
  },
  {
    day: "T",
    activity: "Technique Training",
    duration: "60 min",
    completed: true,
  },
  {
    day: "W",
    activity: "Cardio & Recovery",
    duration: "40 min",
    completed: true,
  },
  {
    day: "T",
    activity: "Strength & Power",
    duration: "50 min",
    completed: true,
  },
  {
    day: "F",
    activity: "Opposite Foot Training",
    duration: "35 min",
    completed: true,
  },
  {
    day: "S",
    activity: "Light Recovery",
    duration: "30 min",
    completed: false,
    isToday: true,
  },
  {
    day: "S",
    activity: "Rest Day",
    duration: "Recovery",
    completed: false,
    isRest: true,
  },
];
