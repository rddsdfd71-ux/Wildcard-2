import { Pool } from "pg";
import crypto from "crypto";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "wildcard_salt_2026").digest("hex");
}

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(255),
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_progression (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        explosive_power_level INTEGER DEFAULT 1,
        opposite_foot_level INTEGER DEFAULT 1,
        cardio_level INTEGER DEFAULT 1,
        strength_level INTEGER DEFAULT 1,
        upper_body_level INTEGER DEFAULT 1,
        lower_body_level INTEGER DEFAULT 1,
        overall_level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        next_level_xp INTEGER DEFAULT 100,
        progress_to_next DECIMAL DEFAULT 0,
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS user_position (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        current_position VARCHAR(10),
        goal_position VARCHAR(10),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        workout_type VARCHAR(50) NOT NULL,
        duration INTEGER DEFAULT 0,
        difficulty VARCHAR(20) DEFAULT 'medium',
        exercises INTEGER DEFAULT 0,
        performance_rating INTEGER DEFAULT 3,
        calories INTEGER DEFAULT 0,
        completed_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_valuations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        market_value INTEGER DEFAULT 0,
        tier VARCHAR(50) DEFAULT 'Amateur',
        strengths TEXT[] DEFAULT '{}',
        weaknesses TEXT[] DEFAULT '{}',
        improvement_plan JSONB DEFAULT '[]',
        professional_comparison VARCHAR(200) DEFAULT '',
        overall_rating INTEGER DEFAULT 50,
        advice TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS ai_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        valuation_used INTEGER DEFAULT 0,
        valuation_limit INTEGER DEFAULT 5,
        position_analysis_used INTEGER DEFAULT 0,
        position_analysis_limit INTEGER DEFAULT 5,
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        total_score INTEGER DEFAULT 0,
        rank INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS training_programs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        difficulty VARCHAR(20) DEFAULT 'intermediate',
        duration VARCHAR(20),
        workouts_per_week INTEGER DEFAULT 3,
        focus_area VARCHAR(100),
        target_muscles VARCHAR(100),
        type VARCHAR(50),
        benefits TEXT[] DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        training_program_id INTEGER REFERENCES training_programs(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        duration VARCHAR(20),
        focus_area VARCHAR(50),
        exercises JSONB DEFAULT '[]'
      );
    `);

    const { rows: existing } = await client.query("SELECT COUNT(*) FROM training_programs");
    if (parseInt(existing[0].count) === 0) {
      await seedData(client);
    }

    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

async function seedData(client: any) {
  const programs = [
    {
      name: "Explosive Power Program",
      description: "Build elite explosive power to dominate every sprint, jump, and tackle on the pitch.",
      category: "Strength & Power",
      difficulty: "advanced",
      duration: "8 weeks",
      workoutsPerWeek: 4,
      focusArea: "lower_body",
      targetMuscles: "3",
      type: "explosive",
      benefits: ["Increased sprint speed", "Better jump height", "More powerful shots", "Faster acceleration"],
    },
    {
      name: "Opposite Foot Mastery",
      description: "Develop elite-level skill with your weaker foot to become a truly two-footed player.",
      category: "Technical Skills",
      difficulty: "intermediate",
      duration: "6 weeks",
      workoutsPerWeek: 5,
      focusArea: "technique",
      targetMuscles: "4",
      type: "technique",
      benefits: ["Complete two-footed player", "Unpredictable in tight spaces", "More shooting options", "Better balance"],
    },
    {
      name: "Cardio Endurance Base",
      description: "Build the aerobic engine you need to dominate the full 90 minutes and beyond.",
      category: "Fitness & Conditioning",
      difficulty: "beginner",
      duration: "6 weeks",
      workoutsPerWeek: 4,
      focusArea: "cardio",
      targetMuscles: "3",
      type: "cardio",
      benefits: ["90-minute stamina", "Faster recovery", "Better concentration late in games", "Reduced injury risk"],
    },
    {
      name: "Plyometric Training",
      description: "Advanced plyometric exercises to develop fast-twitch muscle fibers for explosive movement.",
      category: "Athletic Performance",
      difficulty: "advanced",
      duration: "4 weeks",
      workoutsPerWeek: 3,
      focusArea: "full_body",
      targetMuscles: "5",
      type: "plyometric",
      benefits: ["Explosive first touch", "Reactive agility", "Jump height improvement", "Sprint power"],
    },
  ];

  for (const prog of programs) {
    const res = await client.query(
      `INSERT INTO training_programs (name, description, category, difficulty, duration, workouts_per_week, focus_area, target_muscles, type, benefits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [prog.name, prog.description, prog.category, prog.difficulty, prog.duration, prog.workoutsPerWeek, prog.focusArea, prog.targetMuscles, prog.type, prog.benefits]
    );
    const programId = res.rows[0].id;

    const workouts = getWorkoutsForProgram(prog.type, programId);
    for (const workout of workouts) {
      await client.query(
        `INSERT INTO workouts (training_program_id, name, description, duration, focus_area, exercises)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [programId, workout.name, workout.description, workout.duration, workout.focusArea, JSON.stringify(workout.exercises)]
      );
    }
  }
}

function getWorkoutsForProgram(type: string, programId: number) {
  if (type === "explosive") {
    return [
      {
        name: "Power Squat Circuit",
        description: "Heavy compound lower body training with explosive concentric phase",
        duration: "45 min",
        focusArea: "Lower Body",
        exercises: [
          { name: "Back Squat", sets: 4, reps: "6" },
          { name: "Box Jumps", sets: 4, reps: "8" },
          { name: "Romanian Deadlift", sets: 3, reps: "8" },
          { name: "Leg Press", sets: 3, reps: "10" },
        ],
      },
      {
        name: "Sprint & Acceleration",
        description: "Sprint drills focused on acceleration and top-end speed",
        duration: "40 min",
        focusArea: "Speed",
        exercises: [
          { name: "10m Acceleration Sprints", sets: 6, reps: "1" },
          { name: "30m Flying Sprints", sets: 4, reps: "1" },
          { name: "Cone Agility Drills", sets: 3, reps: "5" },
          { name: "Resisted Band Sprints", sets: 4, reps: "1" },
        ],
      },
    ];
  } else if (type === "technique") {
    return [
      {
        name: "Weak Foot Passing Drills",
        description: "Progressive passing exercises using only your weaker foot",
        duration: "35 min",
        focusArea: "Ball Control",
        exercises: [
          { name: "Wall Pass (Weak Foot)", sets: 3, reps: "20" },
          { name: "Short Pass Combinations", sets: 3, reps: "15" },
          { name: "Long Ball Distribution", sets: 3, reps: "10" },
          { name: "One-Touch Pass Drill", sets: 4, reps: "12" },
        ],
      },
      {
        name: "Weak Foot Shooting",
        description: "Shooting drills designed to build power and accuracy with your weaker foot",
        duration: "40 min",
        focusArea: "Finishing",
        exercises: [
          { name: "Stationary Shooting (Weak)", sets: 4, reps: "10" },
          { name: "Moving Shooting Drill", sets: 3, reps: "8" },
          { name: "Turn and Shoot", sets: 3, reps: "6" },
          { name: "Volleys (Weak Foot)", sets: 3, reps: "8" },
        ],
      },
    ];
  } else if (type === "cardio") {
    return [
      {
        name: "Aerobic Base Run",
        description: "Steady-state aerobic running to build endurance base",
        duration: "50 min",
        focusArea: "Cardiovascular",
        exercises: [
          { name: "Warm-up Jog", sets: 1, reps: "10 min" },
          { name: "Steady State Run (70% HR)", sets: 1, reps: "30 min" },
          { name: "Cool Down Walk", sets: 1, reps: "10 min" },
        ],
      },
      {
        name: "Interval Training",
        description: "High-intensity intervals to boost VO2 max and match fitness",
        duration: "45 min",
        focusArea: "Stamina",
        exercises: [
          { name: "High Knee Intervals", sets: 6, reps: "30s on / 30s off" },
          { name: "Shuttle Runs", sets: 5, reps: "1" },
          { name: "Burpees", sets: 4, reps: "10" },
          { name: "Mountain Climbers", sets: 4, reps: "20" },
        ],
      },
    ];
  } else {
    return [
      {
        name: "Plyometric Jump Circuit",
        description: "Advanced jumping and reactive training for explosive athletic performance",
        duration: "40 min",
        focusArea: "Power",
        exercises: [
          { name: "Depth Jumps", sets: 4, reps: "6" },
          { name: "Broad Jumps", sets: 4, reps: "5" },
          { name: "Lateral Bounds", sets: 3, reps: "8" },
          { name: "Single-Leg Box Hops", sets: 3, reps: "8" },
        ],
      },
      {
        name: "Reactive Agility Drills",
        description: "Reactive drills that develop fast-twitch responses and change of direction speed",
        duration: "35 min",
        focusArea: "Agility",
        exercises: [
          { name: "Ladder Drills", sets: 4, reps: "1 length" },
          { name: "T-Agility Test", sets: 4, reps: "1" },
          { name: "4-Cone Drill", sets: 5, reps: "1" },
          { name: "Pro Agility Shuttle", sets: 4, reps: "1" },
        ],
      },
    ];
  }
}
