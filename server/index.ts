import express from "express";
import cors from "cors";
import { pool, hashPassword, initializeDatabase } from "./db.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── REDIS CACHE (graceful fallback) ──────────────────────────────────────
let redisClient: any = null;

async function initRedis() {
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url: "redis://localhost:6379", socket: { connectTimeout: 2000, reconnectStrategy: false } });
    client.on("error", () => {});
    await client.connect();
    redisClient = client;
    console.log("Redis connected");
  } catch {
    console.log("Redis unavailable — running without cache");
  }
}

async function cacheGet(key: string): Promise<any | null> {
  if (!redisClient) return null;
  try {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function cacheSet(key: string, value: any, ttlSeconds = 300): Promise<void> {
  if (!redisClient) return;
  try { await redisClient.setEx(key, ttlSeconds, JSON.stringify(value)); } catch {}
}

async function cacheDel(key: string): Promise<void> {
  if (!redisClient) return;
  try { await redisClient.del(key); } catch {}
}

// ── IN-MEMORY RATE LIMITER ───────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(windowMs: number, maxRequests: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({ message: "Too many requests — please slow down." });
    }
    next();
  };
}

const authRateLimit = rateLimit(60_000, 5);
const apiRateLimit = rateLimit(60_000, 60);

// Apply rate limits
app.use("/api/auth", authRateLimit);
app.use("/api", apiRateLimit);

// ── AUTH ────────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  if (username.length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1)",
      [username.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Username already taken. Please choose another." });
    }
    const passwordHash = hashPassword(password);
    const { rows } = await pool.query(
      "INSERT INTO users (username, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, username, full_name",
      [username.trim(), passwordHash, fullName?.trim() || null]
    );
    const user = rows[0];
    await pool.query("INSERT INTO user_progression (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    await pool.query("INSERT INTO ai_usage (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    await pool.query("INSERT INTO leaderboard (user_id, total_score) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    res.status(201).json({ userId: user.id, username: user.username, fullName: user.full_name });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, username, full_name, is_premium FROM users WHERE LOWER(username) = LOWER($1)",
      [username.trim()]
    );
    if (rows.length === 0) return res.status(401).json({ message: "Invalid username or password" });
    const user = rows[0];
    const passwordHash = hashPassword(password);
    const { rows: check } = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND password_hash = $2",
      [user.id, passwordHash]
    );
    if (check.length === 0) return res.status(401).json({ message: "Invalid username or password" });
    await pool.query("INSERT INTO user_progression (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    await pool.query("INSERT INTO ai_usage (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    res.json({ userId: user.id, username: user.username, fullName: user.full_name, isPremium: user.is_premium });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ── USER PROFILE ────────────────────────────────────────────────────────

app.get("/api/users/:id/profile", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    const { rows } = await pool.query(
      "SELECT id, username, full_name, email, country, is_premium, created_at FROM users WHERE id = $1",
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    const u = rows[0];
    res.json({ id: u.id, username: u.username, fullName: u.full_name, email: u.email, country: u.country, isPremium: u.is_premium, createdAt: u.created_at });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/users/:id/profile", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  const { displayName, email, country } = req.body;
  try {
    await pool.query(
      "UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), country = COALESCE($3, country), updated_at = NOW() WHERE id = $4",
      [displayName || null, email || null, country || null, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PROGRESSION ─────────────────────────────────────────────────────────

app.get("/api/users/:id/progression", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    await pool.query("INSERT INTO user_progression (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
    const { rows } = await pool.query("SELECT * FROM user_progression WHERE user_id = $1", [userId]);
    if (rows.length === 0) return res.json(defaultProgression());
    const p = rows[0];
    res.json({
      explosivePowerLevel: p.explosive_power_level, oppositeFootLevel: p.opposite_foot_level,
      cardioLevel: p.cardio_level, strengthLevel: p.strength_level, upperBodyLevel: p.upper_body_level,
      lowerBodyLevel: p.lower_body_level, overallLevel: p.overall_level, experience: p.experience,
      nextLevelXP: p.next_level_xp, progressToNext: parseFloat(p.progress_to_next),
    });
  } catch (err) {
    res.json(defaultProgression());
  }
});

function defaultProgression() {
  return { explosivePowerLevel: 1, oppositeFootLevel: 1, cardioLevel: 1, strengthLevel: 1, upperBodyLevel: 1, lowerBodyLevel: 1, overallLevel: 1, experience: 0, nextLevelXP: 100, progressToNext: 0 };
}

// POST workout-sessions — called when a user starts a workout
app.post("/api/users/:id/workout-sessions", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  const { workoutId, workoutName, durationMinutes = 30, difficulty = "medium" } = req.body;
  try {
    const calories = Math.round(durationMinutes * 7 * (difficulty === "hard" || difficulty === "advanced" ? 1.3 : 1));
    const { rows } = await pool.query(
      "INSERT INTO workout_sessions (user_id, workout_type, duration, difficulty, exercises, performance_rating, calories) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [userId, workoutName || "general", durationMinutes, difficulty, 0, 3, calories]
    );
    res.status(201).json({ sessionId: rows[0].id, message: "Session started" });
  } catch (err: any) {
    console.error("Create session error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/users/:id/complete-workout", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  const { workoutType = "general", duration = 30, difficulty = "medium", exercises = 0, performanceRating = 3 } = req.body;

  const xpMap: Record<string, number> = { low: 15, easy: 15, medium: 30, intermediate: 30, hard: 50, advanced: 50 };
  const baseXP = xpMap[difficulty.toLowerCase()] || 30;
  const xpGained = Math.round(baseXP * (1 + (performanceRating - 3) * 0.2) * (duration / 30));
  const calories = Math.round(duration * 7 * (difficulty === "hard" || difficulty === "advanced" ? 1.3 : 1));

  try {
    await pool.query(
      "INSERT INTO workout_sessions (user_id, workout_type, duration, difficulty, exercises, performance_rating, calories) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [userId, workoutType, duration, difficulty, exercises, performanceRating, calories]
    );
    await pool.query("INSERT INTO user_progression (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);

    const { rows: prog } = await pool.query("SELECT * FROM user_progression WHERE user_id = $1", [userId]);
    const p = prog[0];
    const newXP = (p.experience || 0) + xpGained;
    const nextXP = p.next_level_xp || 100;
    let newOverall = p.overall_level || 1;
    let levelUps = 0;
    let currentXP = newXP;
    let currentNextXP = nextXP;

    while (currentXP >= currentNextXP) {
      currentXP -= currentNextXP;
      newOverall++;
      levelUps++;
      currentNextXP = Math.round(currentNextXP * 1.5);
    }

    const typeToField: Record<string, string> = {
      explosive: "explosive_power_level", technique: "opposite_foot_level", cardio: "cardio_level",
      strength: "strength_level", upper_body: "upper_body_level", lower_body: "lower_body_level",
    };
    const skillField = typeToField[workoutType.toLowerCase()] || "explosive_power_level";

    await pool.query(
      `UPDATE user_progression SET experience = $1, next_level_xp = $2, overall_level = $3,
       progress_to_next = $4, ${skillField} = LEAST(${skillField} + $5, 99)
       WHERE user_id = $6`,
      [currentXP, currentNextXP, newOverall, Math.round((currentXP / currentNextXP) * 100), levelUps > 0 ? 1 : 0, userId]
    );

    await pool.query(
      `INSERT INTO leaderboard (user_id, total_score) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET total_score = leaderboard.total_score + $2, updated_at = NOW()`,
      [userId, xpGained]
    );

    const { rows: updated } = await pool.query("SELECT * FROM user_progression WHERE user_id = $1", [userId]);
    const u = updated[0];
    const rewards = levelUps > 0 ? [{ level: newOverall, category: "Overall Level", xpGained, unlocks: ["New training content"], message: `You reached Overall Level ${newOverall}!` }] : [];

    // Invalidate leaderboard cache
    await cacheDel("leaderboard:all");

    res.json({
      progression: {
        explosivePowerLevel: u.explosive_power_level, oppositeFootLevel: u.opposite_foot_level,
        cardioLevel: u.cardio_level, strengthLevel: u.strength_level, upperBodyLevel: u.upper_body_level,
        lowerBodyLevel: u.lower_body_level, overallLevel: u.overall_level, experience: u.experience,
        nextLevelXP: u.next_level_xp, progressToNext: parseFloat(u.progress_to_next),
      },
      rewards,
      message: levelUps > 0 ? `Leveled up to Overall ${newOverall}!` : `+${xpGained} XP earned!`,
      levelUps,
    });
  } catch (err: any) {
    console.error("Complete workout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── WEEKLY PROGRESS ─────────────────────────────────────────────────────

app.get("/api/users/:id/weekly-progress", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const shorts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const { rows } = await pool.query(
      `SELECT DATE(completed_at) as date, COUNT(*) as sessions
       FROM workout_sessions WHERE user_id = $1 AND completed_at >= $2 GROUP BY DATE(completed_at)`,
      [userId, startOfWeek.toISOString()]
    );

    const sessionMap: Record<string, number> = {};
    rows.forEach((r: any) => { sessionMap[r.date.toISOString().split("T")[0]] = parseInt(r.sessions); });

    const breakdown = days.map((day, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      return { day, dayShort: shorts[i], sessions: sessionMap[dateStr] || 0, date: dateStr };
    });

    const completed = breakdown.filter(d => d.sessions > 0).length;
    const weeklyGoal = 5;
    res.json({ completed, weeklyGoal, progressPercentage: Math.round((completed / weeklyGoal) * 100), dailyBreakdown: breakdown });
  } catch (err) {
    res.json({ completed: 0, weeklyGoal: 5, progressPercentage: 0, dailyBreakdown: [] });
  }
});

// ── STATS SUMMARY ───────────────────────────────────────────────────────

app.get("/api/users/:id/stats/summary", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    const dow = today.getDay();
    weekStart.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const [todayRows, weekRows, allRows, dailyRows] = await Promise.all([
      pool.query("SELECT COUNT(*) sessions, SUM(calories) calories, SUM(duration) minutes FROM workout_sessions WHERE user_id=$1 AND completed_at >= $2", [userId, today.toISOString()]),
      pool.query("SELECT COUNT(*) sessions, SUM(calories) calories, SUM(duration) minutes FROM workout_sessions WHERE user_id=$1 AND completed_at >= $2", [userId, weekStart.toISOString()]),
      pool.query("SELECT COUNT(*) sessions, SUM(calories) calories, SUM(duration) minutes FROM workout_sessions WHERE user_id=$1", [userId]),
      pool.query(`SELECT DATE(completed_at) as date, COUNT(*) sessions, SUM(calories) calories FROM workout_sessions WHERE user_id=$1 AND completed_at >= $2 GROUP BY DATE(completed_at)`, [userId, sevenDaysAgo.toISOString()]),
    ]);

    const t = todayRows.rows[0];
    const w = weekRows.rows[0];
    const a = allRows.rows[0];

    const dailyMap: Record<string, any> = {};
    dailyRows.rows.forEach((r: any) => { dailyMap[r.date.toISOString().split("T")[0]] = r; });

    const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const row = dailyMap[dateStr];
      return { date: dateStr, label: days[d.getDay() === 0 ? 6 : d.getDay() - 1], sessions: row ? parseInt(row.sessions) : 0, calories: row ? parseInt(row.calories) || 0 : 0, minutes: 0 };
    });

    res.json({
      today: { date: today.toISOString(), label: today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }), sessions: parseInt(t.sessions) || 0, calories: parseInt(t.calories) || 0, minutes: parseInt(t.minutes) || 0 },
      thisWeek: { sessions: parseInt(w.sessions) || 0, calories: parseInt(w.calories) || 0, hours: Math.round((parseInt(w.minutes) || 0) / 60 * 10) / 10 },
      allTime: { sessions: parseInt(a.sessions) || 0, calories: parseInt(a.calories) || 0, hours: Math.round((parseInt(a.minutes) || 0) / 60 * 10) / 10 },
      dailyBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/users/:id/score", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    const { rows } = await pool.query("SELECT total_score FROM leaderboard WHERE user_id=$1", [userId]);
    res.json({ score: rows[0]?.total_score || 0 });
  } catch (err) {
    res.json({ score: 0 });
  }
});

// ── AI USAGE ────────────────────────────────────────────────────────────

app.get("/api/users/:id/ai-usage", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    await pool.query("INSERT INTO ai_usage (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
    const { rows } = await pool.query("SELECT * FROM ai_usage WHERE user_id=$1", [userId]);
    const u = rows[0];
    res.json({
      valuation: { used: u.valuation_used, limit: u.valuation_limit },
      positionAnalysis: { used: u.position_analysis_used, limit: u.position_analysis_limit },
    });
  } catch (err) {
    res.json({ valuation: { used: 0, limit: 5 }, positionAnalysis: { used: 0, limit: 5 } });
  }
});

// ── POSITION ────────────────────────────────────────────────────────────

app.get("/api/users/:id/position-status", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    const { rows } = await pool.query("SELECT * FROM user_position WHERE user_id=$1", [userId]);
    if (rows.length === 0) return res.json({ currentPosition: null, goalPosition: null });
    res.json({ currentPosition: rows[0].current_position, goalPosition: rows[0].goal_position });
  } catch (err) {
    res.json({ currentPosition: null, goalPosition: null });
  }
});

app.put("/api/users/:id/position-status", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  const { currentPosition, goalPosition } = req.body;
  try {
    await pool.query(
      `INSERT INTO user_position (user_id, current_position, goal_position) VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET current_position=$2, goal_position=$3, updated_at=NOW()`,
      [userId, currentPosition, goalPosition]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── VALUATION ───────────────────────────────────────────────────────────

app.get("/api/users/:id/valuation", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    const { rows } = await pool.query("SELECT * FROM user_valuations WHERE user_id=$1", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "No valuation found" });
    const v = rows[0];
    res.json({
      id: v.id, userId: v.user_id, marketValue: v.market_value, tier: v.tier,
      strengths: v.strengths, weaknesses: v.weaknesses, improvementPlan: v.improvement_plan,
      professionalComparison: v.professional_comparison, overallRating: v.overall_rating,
      advice: v.advice, createdAt: v.created_at, updatedAt: v.updated_at,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/users/:id/valuation/calculate", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    const { rows: usage } = await pool.query("SELECT * FROM ai_usage WHERE user_id=$1", [userId]);
    if (usage.length > 0 && usage[0].valuation_used >= usage[0].valuation_limit) {
      return res.status(403).json({ message: "Free valuation limit reached (5/5). Upgrade to premium for unlimited valuations." });
    }

    const { rows: prog } = await pool.query("SELECT * FROM user_progression WHERE user_id=$1", [userId]);
    const { rows: sessions } = await pool.query("SELECT COUNT(*) total FROM workout_sessions WHERE user_id=$1", [userId]);
    const totalSessions = parseInt(sessions[0]?.total) || 0;
    const p = prog[0] || {};
    const overallLevel = p.overall_level || 1;
    const baseValue = overallLevel * 500 + totalSessions * 100;
    const tiers = [
      { min: 0, max: 1000, tier: "Amateur", comp: "Sunday League Player" },
      { min: 1000, max: 5000, tier: "Semi-Pro", comp: "Regional League Player" },
      { min: 5000, max: 15000, tier: "Professional", comp: "League One/Two Player" },
      { min: 15000, max: 50000, tier: "Elite", comp: "Championship Player" },
      { min: 50000, max: Infinity, tier: "World Class", comp: "Premier League Player" },
    ];
    const tierInfo = tiers.find(t => baseValue >= t.min && baseValue < t.max) || tiers[0];
    const valuation = {
      marketValue: baseValue,
      tier: tierInfo.tier,
      strengths: overallLevel >= 3 ? ["Physical conditioning", "Training consistency"] : ["Potential", "Dedication"],
      weaknesses: overallLevel < 5 ? ["Technical skills need development", "Match experience limited"] : ["Injury prevention", "Mental resilience"],
      improvementPlan: [{ priority: "High", actions: ["Complete 5 workouts this week", "Focus on weakest skill area"], expectedValueIncrease: 500, timeframe: "2 weeks" }],
      professionalComparison: tierInfo.comp,
      overallRating: Math.min(50 + overallLevel * 5 + totalSessions * 2, 99),
      advice: `Keep training consistently. You're ${tierInfo.tier} level — ${totalSessions} sessions completed.`,
    };

    await pool.query(
      `INSERT INTO user_valuations (user_id, market_value, tier, strengths, weaknesses, improvement_plan, professional_comparison, overall_rating, advice)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id) DO UPDATE SET market_value=$2, tier=$3, strengths=$4, weaknesses=$5, improvement_plan=$6, professional_comparison=$7, overall_rating=$8, advice=$9, updated_at=NOW()`,
      [userId, valuation.marketValue, valuation.tier, valuation.strengths, valuation.weaknesses, JSON.stringify(valuation.improvementPlan), valuation.professionalComparison, valuation.overallRating, valuation.advice]
    );
    await pool.query(
      "INSERT INTO ai_usage (user_id, valuation_used) VALUES ($1,1) ON CONFLICT (user_id) DO UPDATE SET valuation_used = ai_usage.valuation_used + 1",
      [userId]
    );

    const { rows } = await pool.query("SELECT * FROM user_valuations WHERE user_id=$1", [userId]);
    const v = rows[0];
    res.json({
      id: v.id, userId: v.user_id, marketValue: v.market_value, tier: v.tier,
      strengths: v.strengths, weaknesses: v.weaknesses, improvementPlan: v.improvement_plan,
      professionalComparison: v.professional_comparison, overallRating: v.overall_rating,
      advice: v.advice, createdAt: v.created_at, updatedAt: v.updated_at,
    });
  } catch (err: any) {
    console.error("Valuation error:", err);
    res.status(500).json({ message: "Server error calculating valuation" });
  }
});

// ── POSITION ANALYSIS (locked — returns 503) ─────────────────────────────

app.post("/api/users/:id/analyze-position", async (_req, res) => {
  res.status(503).json({ message: "AI Position Analysis is temporarily unavailable." });
});

app.post("/api/users/:id/position/analyze", async (_req, res) => {
  res.status(503).json({ message: "AI Position Analysis is temporarily unavailable." });
});

// ── TECHNIQUES ───────────────────────────────────────────────────────────

app.get("/api/techniques", async (req, res) => {
  const { category } = req.query;
  const cacheKey = `techniques:${category || "all"}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    let query = `SELECT id, name, description, category, difficulty, focus, steps, tips, common_mistakes, practice_exercises, video_url, is_popular FROM techniques`;
    const params: any[] = [];
    if (category && category !== "all") {
      query += ` WHERE category = $1`;
      params.push(category);
    }
    query += ` ORDER BY is_popular DESC, id`;

    const { rows } = await pool.query(query, params);
    const techniques = rows.map(t => ({
      id: t.id, name: t.name, description: t.description, category: t.category,
      difficulty: t.difficulty, focus: t.focus, steps: t.steps, tips: t.tips,
      commonMistakes: t.common_mistakes, practiceExercises: t.practice_exercises,
      videoUrl: t.video_url, isPopular: t.is_popular,
    }));

    await cacheSet(cacheKey, techniques, 600);
    res.json(techniques);
  } catch (err) {
    res.json([]);
  }
});

// ── TRAINING PROGRAMS ────────────────────────────────────────────────────

app.get("/api/training-programs", async (_req, res) => {
  const cached = await cacheGet("training-programs");
  if (cached) return res.json(cached);

  try {
    const { rows } = await pool.query("SELECT * FROM training_programs ORDER BY id");
    const result = rows.map(p => ({
      id: p.id, name: p.name, description: p.description, category: p.category,
      difficulty: p.difficulty, duration: p.duration, workoutsPerWeek: p.workouts_per_week,
      focusArea: p.focus_area, targetMuscles: p.target_muscles, type: p.type, benefits: p.benefits,
    }));
    await cacheSet("training-programs", result, 600);
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

app.get("/api/workouts", async (_req, res) => {
  const cached = await cacheGet("workouts:all");
  if (cached) return res.json(cached);

  try {
    const { rows } = await pool.query("SELECT * FROM workouts ORDER BY id");
    const result = rows.map(w => ({
      id: w.id, trainingProgramId: w.training_program_id, name: w.name,
      description: w.description, duration: parseInt(w.duration) || 30, focusArea: w.focus_area, exercises: w.exercises,
    }));
    await cacheSet("workouts:all", result, 600);
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

app.get("/api/users/:id/training-programs/:pid/progress", async (req, res) => {
  const userId = parseInt(req.params.id);
  const programId = parseInt(req.params.pid);
  if (isNaN(userId) || isNaN(programId)) return res.json({ currentWeek: 1, totalWeeks: 12, progressPercentage: 8 });
  try {
    const { rows } = await pool.query("SELECT COUNT(*) sessions FROM workout_sessions WHERE user_id=$1", [userId]);
    const total = parseInt(rows[0].sessions) || 0;
    const currentWeek = Math.min(Math.floor(total / 3) + 1, 12);
    res.json({ currentWeek, totalWeeks: 12, progressPercentage: Math.round((currentWeek / 12) * 100) });
  } catch (err) {
    res.json({ currentWeek: 1, totalWeeks: 12, progressPercentage: 8 });
  }
});

// ── LEADERBOARD ──────────────────────────────────────────────────────────

app.get("/api/leaderboard", async (_req, res) => {
  const cached = await cacheGet("leaderboard:all");
  if (cached) return res.json(cached);

  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.user_id, l.total_score, u.username, u.full_name, u.country, u.is_premium
       FROM leaderboard l JOIN users u ON l.user_id = u.id
       WHERE u.hidden IS NOT TRUE
       ORDER BY l.total_score DESC LIMIT 100`
    );
    const ranked = rows.map((r, i) => ({
      id: r.id, userId: r.user_id, rank: i + 1, totalScore: r.total_score,
      username: r.username, fullName: r.full_name || r.username,
      country: r.country || null, updatedAt: new Date().toISOString(),
    }));
    await cacheSet("leaderboard:all", ranked, 120);
    res.json(ranked);
  } catch (err) {
    res.json([]);
  }
});

// ── PROGRESS CHARTS DATA ─────────────────────────────────────────────────

app.get("/api/users/:id/progress-charts", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.json({ daily: [], weekly: [] });
  try {
    const { rows } = await pool.query(
      `SELECT DATE(completed_at) as date, COUNT(*) sessions, SUM(duration) minutes, SUM(calories) calories
       FROM workout_sessions WHERE user_id=$1 AND completed_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(completed_at) ORDER BY date`,
      [userId]
    );
    res.json({ daily: rows.map(r => ({ date: r.date, sessions: parseInt(r.sessions), minutes: parseInt(r.minutes) || 0, calories: parseInt(r.calories) || 0 })) });
  } catch (err) {
    res.json({ daily: [], weekly: [] });
  }
});

// ── HEALTH / MANUAL ENTRY ────────────────────────────────────────────────

app.get("/api/users/:id/health-data", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { rows } = await pool.query(
      "SELECT SUM(duration) minutes, SUM(calories) calories, COUNT(*) sessions FROM workout_sessions WHERE user_id=$1 AND completed_at >= $2",
      [userId, today.toISOString()]
    );
    const r = rows[0];
    res.json({ steps: 0, activeMinutes: parseInt(r.minutes) || 0, calories: parseInt(r.calories) || 0, sessions: parseInt(r.sessions) || 0 });
  } catch (err) {
    res.json({ steps: 0, activeMinutes: 0, calories: 0, sessions: 0 });
  }
});

app.post("/api/users/:id/manual-health-entry", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
  const { activityType = "general", duration = 30, calories } = req.body;
  try {
    const cal = calories || Math.round(duration * 6);
    await pool.query(
      "INSERT INTO workout_sessions (user_id, workout_type, duration, calories, difficulty) VALUES ($1,$2,$3,$4,'medium')",
      [userId, activityType, duration, cal]
    );
    res.json({ success: true, calories: cal });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── NUTRITION ────────────────────────────────────────────────────────────

app.get("/api/nutrition/plans", async (_req, res) => {
  res.json([
    { id: 1, name: "Pre-Match Fuel", description: "Optimised nutrition for match day", calories: 2800, meals: [] },
    { id: 2, name: "Recovery Plan", description: "Post-training recovery nutrition", calories: 2400, meals: [] },
    { id: 3, name: "Bulking Plan", description: "High-calorie plan for muscle gain", calories: 3200, meals: [] },
  ]);
});

// ── SUBSCRIPTION ─────────────────────────────────────────────────────────

app.get("/api/subscription/status", async (_req, res) => {
  res.json({ isPremium: false, plan: "free", features: ["Basic training", "Leaderboard", "5 AI analyses"] });
});

// ── STARTUP ──────────────────────────────────────────────────────────────

async function startServer() {
  await initRedis();
  await initializeDatabase();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Wild Card API server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
