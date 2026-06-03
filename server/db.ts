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
        country VARCHAR(100),
        is_premium BOOLEAN DEFAULT FALSE,
        hidden BOOLEAN DEFAULT FALSE,
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

      CREATE TABLE IF NOT EXISTS techniques (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        difficulty VARCHAR(20) DEFAULT 'beginner',
        focus VARCHAR(20),
        steps TEXT[] DEFAULT '{}',
        tips TEXT[] DEFAULT '{}',
        common_mistakes TEXT[] DEFAULT '{}',
        practice_exercises TEXT[] DEFAULT '{}',
        video_url VARCHAR(500),
        is_popular BOOLEAN DEFAULT FALSE
      );
    `);

    // Add columns if they don't exist (for existing databases)
    await client.query(`
      DO $$ BEGIN
        BEGIN ALTER TABLE users ADD COLUMN country VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
        BEGIN ALTER TABLE users ADD COLUMN hidden BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END;
      END $$;
    `);

    // Hide test accounts from leaderboard
    await client.query(`
      UPDATE users SET hidden = TRUE WHERE username IN ('testuser', 'wildtest2');
    `);

    const { rows: existing } = await client.query("SELECT COUNT(*) FROM training_programs");
    if (parseInt(existing[0].count) === 0) {
      await seedTrainingData(client);
    }

    const { rows: techExisting } = await client.query("SELECT COUNT(*) FROM techniques");
    if (parseInt(techExisting[0].count) === 0) {
      await seedTechniques(client);
    }

    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

async function seedTechniques(client: any) {
  const techniques = [
    // SHOOTING
    {
      name: "Power Shot", description: "Strike the ball with maximum force using the laces for raw power.", category: "shooting", difficulty: "intermediate", focus: null,
      steps: ["Plant your non-kicking foot beside the ball", "Approach at a slight angle", "Lock your ankle and strike with the laces", "Follow through with full leg extension", "Keep your head down and eyes on the ball"],
      tips: ["Keep your body over the ball to keep the shot low", "Use your arms for balance during the kick", "Practice against a wall at varying distances"],
      commonMistakes: ["Leaning back causes the shot to go high", "Not locking the ankle reduces power", "Looking up too early throws off accuracy"],
      practiceExercises: ["Strike stationary balls at a target 20m away (10 reps)", "Moving ball power shots after a pass (8 reps)", "Strike from the edge of the box after controlling a long ball"],
      videoUrl: "https://www.youtube.com/watch?v=F6B5S8_TKQA", isPopular: true
    },
    {
      name: "Knuckleball", description: "Create an unpredictable dipping and swerving flight with minimal spin.", category: "shooting", difficulty: "advanced", focus: null,
      steps: ["Approach the ball straight on", "Strike with your toes pointing down and laces flat", "Hit the dead centre of the ball", "Do NOT follow through — stop your foot sharply", "Keep your body upright"],
      tips: ["Less follow-through = more knuckle effect", "Works best from 20-30 metres", "Strike the valve point of the ball"],
      commonMistakes: ["Too much follow-through kills the effect", "Striking off-centre adds unwanted spin", "Running approach too fast"],
      practiceExercises: ["20 stationary strikes focusing on no spin", "Strike from set pieces outside the box", "Film yourself to check foot position"],
      videoUrl: "https://www.youtube.com/watch?v=nK58AssP9tc", isPopular: true
    },
    {
      name: "Curved Shot", description: "Bend the ball around defenders and into the far corner using the instep.", category: "shooting", difficulty: "intermediate", focus: null,
      steps: ["Approach at a 45° angle", "Strike the inside-lower part of the ball with your instep", "Wrap your foot around the ball on contact", "Follow through across your body", "Lean slightly over the ball"],
      tips: ["The further inside you strike, the more curve", "Use for shooting around walls in free kicks", "Practice at half-pace first to learn the contact point"],
      commonMistakes: ["Hitting too central reduces curve", "Leaning back causes the ball to rise", "Incorrect approach angle"],
      practiceExercises: ["Curve shots around a mannequin (10 reps)", "Free kick practice around a wall", "Shooting from wide angles to curl into goal"],
      videoUrl: "https://www.youtube.com/watch?v=l9AqCWA2AZM", isPopular: false
    },
    {
      name: "Chip Shot", description: "Delicately lob the ball over an advancing goalkeeper.", category: "shooting", difficulty: "beginner", focus: null,
      steps: ["Identify the keeper is off their line", "Approach at a normal pace", "Stab underneath the ball with a firm, short foot movement", "DO NOT follow through", "Strike the bottom quarter of the ball"],
      tips: ["Confidence is key — commit to the chip", "Works best when the keeper is rushing out", "Keep the motion sharp and compact"],
      commonMistakes: ["Too much follow-through makes it a normal shot", "Striking too early gives keeper time to recover", "Hesitating kills the opportunity"],
      practiceExercises: ["Chip a stationary ball over a cone 2m away (15 reps)", "Chip over an outrushing partner", "Chip shots from 1-on-1 situations in training"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Volley", description: "Strike the ball cleanly while it's in the air before it touches the ground.", category: "shooting", difficulty: "intermediate", focus: null,
      steps: ["Watch the ball all the way onto your foot", "Position yourself side-on to the incoming ball", "Keep your knee slightly bent on the standing leg", "Strike through the middle of the ball", "Follow through toward the target"],
      tips: ["Time your movement to meet the ball at a comfortable height", "Side-volleys are easier to control than front-volleys", "Stay composed — don't rush the technique"],
      commonMistakes: ["Taking your eye off the ball", "Poor body positioning leads to sliced shots", "Overswinging reduces accuracy"],
      practiceExercises: ["Partner throws, volley back (20 reps each side)", "Drop ball volley from waist height (15 reps)", "Cross and volley drill in the box"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Half-Volley", description: "Strike the ball immediately as it bounces off the ground for maximum power.", category: "shooting", difficulty: "advanced", focus: null,
      steps: ["Watch the ball drop to the ground", "Time your strike to hit just as the ball bounces up", "Strike with laces through the centre", "Keep your body over the ball", "Strong follow-through toward target"],
      tips: ["Timing is everything — practice repeatedly", "Aim for the half-second window after the bounce", "Stay light on your feet to adjust positioning"],
      commonMistakes: ["Striking too early (before bounce) or too late", "Leaning back sends ball over the bar", "Stiff ankle reduces power transfer"],
      practiceExercises: ["Drop and half-volley against a wall (20 reps)", "Bouncing ball strikes from 15m (10 reps)", "Serve-and-strike drill with a partner"],
      videoUrl: null, isPopular: false
    },

    // PASSING
    {
      name: "Through Ball", description: "Thread a perfectly weighted pass through the defensive line into space.", category: "passing", difficulty: "advanced", focus: null,
      steps: ["Identify the run before the defender does", "Weight the pass perfectly — not too hard, not too soft", "Pass into space, not at the player's feet", "Use the inside of the foot for accuracy", "Disguise the pass direction with your body"],
      tips: ["Timing the pass with the run is more important than power", "A slight chip can get it over the defensive line", "Practise with moving targets"],
      commonMistakes: ["Passing too early telegraphs the run", "Too much power sends it through to the keeper", "Incorrect weight = offside trap activated"],
      practiceExercises: ["Cones-as-defenders drill, pass through gaps (10 reps)", "2v1 through ball scenarios", "Through ball followed by finish drill"],
      videoUrl: null, isPopular: true
    },
    {
      name: "Long Switch Pass", description: "Switch play quickly with a driven long pass to the opposite flank.", category: "passing", difficulty: "intermediate", focus: null,
      steps: ["Look up to scan the far flank before receiving", "Use your instep for accuracy on longer distances", "Strike through the middle-back of the ball", "Firm, flat trajectory to reach quickly", "Follow through toward the target"],
      tips: ["Plant foot pointing at the target", "Drive the ball, don't loft it — keep it low", "Aim for the player's leading foot"],
      commonMistakes: ["Ball arriving behind the player kills the move", "Too much loft makes it easy to intercept", "Not disguising the pass gives defenders time"],
      practiceExercises: ["30m switching passes to a partner (10 each side)", "Cross-pitch passing with directional targets", "3-zone switching drill with cones"],
      videoUrl: null, isPopular: false
    },
    {
      name: "One-Two Combination", description: "Play a quick give-and-go pass to bypass defenders.", category: "passing", difficulty: "beginner", focus: null,
      steps: ["Pass to a teammate and immediately run beyond the defender", "Teammate plays the ball into space behind the defender", "First touch controls and accelerates past", "Keep the pass short and firm", "Time the run to stay onside"],
      tips: ["Communication with your partner is key", "The run should start as you release the pass", "Works best in tight spaces against a single defender"],
      commonMistakes: ["Running before the pass is made — defender reads it", "Pass is too slow and defender intercepts", "Poor first touch breaks the move down"],
      practiceExercises: ["2-cone one-two drill (20 repetitions)", "One-two into shooting drill", "Small-sided 2v1 games"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Lofted Pass", description: "Chip a pass over pressure and into the path of a moving teammate.", category: "passing", difficulty: "intermediate", focus: null,
      steps: ["Get under the ball with your foot", "Strike the lower half with an open foot", "Follow through upward", "Aim for the falling zone, not the player", "Use when defender is blocking the direct route"],
      tips: ["Height depends on how much you get under the ball", "Works well for switching play over a press", "Accuracy matters more than power"],
      commonMistakes: ["Striking the middle gives a flat pass", "Too much pace makes it impossible to control", "Not reading where the receiver is running"],
      practiceExercises: ["Lofted passing over a stationary cone gate (10 reps)", "Target passing over a 5m height barrier", "Lofted pass into channels drill"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Backheel Pass", description: "Use the back of your heel to redirect the ball without looking.", category: "passing", difficulty: "intermediate", focus: null,
      steps: ["Step over the ball or let it run past you", "Strike the centre of the ball with your heel", "Keep the movement sharp and disguised", "Use when a teammate is behind you", "Don't telegraph with your body"],
      tips: ["Disguise is the key weapon of the backheel", "Works best in tight spaces or from crosses", "Keep weight on the standing foot"],
      commonMistakes: ["Using it when simpler options are available", "Poor contact sends ball wildly", "Looking at the target before playing it"],
      practiceExercises: ["Wall backheel returns (15 reps)", "Backheel pass in 3-man triangle drills", "Rondo games where backheels are encouraged"],
      videoUrl: null, isPopular: false
    },

    // BALL CONTROL
    {
      name: "Chest Control", description: "Cushion aerial balls onto your feet using your chest.", category: "control", difficulty: "beginner", focus: null,
      steps: ["Get into line with the ball early", "Open your chest and lean slightly back", "Let the ball hit your chest and absorb pace", "Immediately look for your next action", "Keep your arms out for balance"],
      tips: ["Create a 'shelf' with your chest by leaning back", "Control then immediately move — don't stand still", "Works best with aerial balls dropping steeply"],
      commonMistakes: ["Chest too flat causes ball to bounce away", "Arms in — makes control awkward", "Not moving quickly after the control"],
      practiceExercises: ["Partner lob and chest control (20 reps)", "Wall throw and chest to feet drill", "Aerial chest control then shoot drill"],
      videoUrl: null, isPopular: false
    },
    {
      name: "First Touch Turn", description: "Use your first touch to control and instantly face a new direction.", category: "control", difficulty: "intermediate", focus: null,
      steps: ["Receive with your back to goal", "Before the ball arrives, decide your turn direction", "Use the outside or inside of your foot to redirect", "Turn through 180° in one motion", "Accelerate immediately after the turn"],
      tips: ["Fake like you're going one way before turning the other", "Weight on the ball of your standing foot for quick rotation", "Practice with both feet equally"],
      commonMistakes: ["Ball too heavy — defender catches up", "Ball too close — no space to turn", "Not checking your shoulder before receiving"],
      practiceExercises: ["Back-to-goal first touch turn drill (10 reps each side)", "Pass, turn and dribble through cones", "Turn and play exercise in pairs"],
      videoUrl: null, isPopular: true
    },
    {
      name: "Roulette (360° Turn)", description: "Zidane's signature spin move to eliminate close-pressing defenders.", category: "control", difficulty: "advanced", focus: null,
      steps: ["Feign to pass or shoot to freeze the defender", "Use the sole of one foot to drag the ball behind you", "Spin 180° and drag again with the other foot", "Complete the full spin and accelerate away", "Keep the ball close throughout"],
      tips: ["Speed of the spin is what beats the defender", "Works best when defender is directly behind you", "The drag must be smooth and controlled"],
      commonMistakes: ["Ball too far from your feet during the spin", "Spinning too slowly — defender recovers", "Using in wrong areas of the pitch"],
      practiceExercises: ["Stationary roulette drill (20 reps)", "Roulette through a cone gate", "Roulette under light pressure from a partner"],
      videoUrl: null, isPopular: true
    },
    {
      name: "Cushion Trap", description: "Absorb the pace of fast passes with a soft, precise first touch.", category: "control", difficulty: "beginner", focus: null,
      steps: ["Keep your eyes on the ball all the way", "Relax your foot or body part at the moment of contact", "Move your controlling surface slightly backward on impact", "Bring the ball to a stop within one stride", "Immediately look up for next action"],
      tips: ["Think of your foot as a pillow — soft contact", "Practice with faster and faster passes", "Work on both feet equally"],
      commonMistakes: ["Foot too tense — ball bounces away", "Not getting in line with the ball", "Controlling too far in front — defender pounces"],
      practiceExercises: ["Rapid-fire wall passing and control (30 reps)", "Partner passing at increasing pace", "Control under light press, then play forward"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Thigh Trap", description: "Use your thigh to cushion dropping balls down to your feet.", category: "control", difficulty: "beginner", focus: null,
      steps: ["Position yourself under the falling ball", "Raise your thigh to meet the ball", "Let the ball hit your thigh and drop", "Step forward to collect on the floor", "Immediately survey your options"],
      tips: ["Relax your thigh on impact for better cushion", "The ball should drop right to your feet", "Great for aerial clearances or long passes"],
      commonMistakes: ["Thigh too stiff causes ball to bounce high", "Positioning off-line means the ball misses", "Not having a plan for after the control"],
      practiceExercises: ["Self-serve thigh trap drill (20 reps)", "Partner lob and thigh control to feet", "Thigh control then turn exercise"],
      videoUrl: null, isPopular: false
    },

    // DRIBBLING
    {
      name: "Step Over", description: "Dummy the ball with a circular foot movement to send a defender the wrong way.", category: "dribbling", difficulty: "beginner", focus: null,
      steps: ["Approach the defender with the ball", "Swing your foot around and over the ball in a circle", "Shift your weight the same way your foot goes", "Push the ball the opposite direction with your other foot", "Accelerate away immediately"],
      tips: ["Sell the dummy with your body, not just your feet", "Speed of execution matters more than the move itself", "Follow up with an explosive burst of pace"],
      commonMistakes: ["Moving too slowly — defender recovers", "Not shifting body weight to sell the dummy", "Ball pushed too far away after the move"],
      practiceExercises: ["Step over then push past cone (20 reps each side)", "Step over in 1v1 scenarios against a partner", "Step over drill with speed gates"],
      videoUrl: null, isPopular: true
    },
    {
      name: "Cruyff Turn", description: "Fake a pass then drag the ball behind your standing leg to change direction.", category: "dribbling", difficulty: "intermediate", focus: null,
      steps: ["Prepare as if to cross or pass", "Plant your standing foot past the ball", "Use the inside of your other foot to drag the ball behind your standing leg", "Turn your body 180° in the same motion", "Accelerate away in the new direction"],
      tips: ["Works best near the touchline when a defender is closing", "Fake the cross as convincingly as possible", "The ball must be dragged tightly behind the leg"],
      commonMistakes: ["Ball dragged too far behind — hard to collect", "Not selling the fake pass first", "Too slow to turn after the drag"],
      practiceExercises: ["Cruyff turn around a cone (15 reps each side)", "Near-touchline Cruyff into cross drill", "Cruyff turn then sprint 10m drill"],
      videoUrl: null, isPopular: true
    },
    {
      name: "Elastico", description: "Rapid outside-then-inside flick to change direction and beat a defender.", category: "dribbling", difficulty: "advanced", focus: null,
      steps: ["Approach the defender with the ball", "Push the ball slightly to the outside with your foot", "In the same motion, instantly flick inside with the same foot", "Accelerate through the gap", "Keep the ball close throughout both touches"],
      tips: ["The faster the two touches, the more effective the move", "Works best in 1v1 situations in tight spaces", "Practice slowly at first to learn the contact points"],
      commonMistakes: ["Too much gap between the two touches telegraphs the move", "Ball pushed too far outside on first touch", "Losing balance during the rapid change of direction"],
      practiceExercises: ["Elastico around a cone (20 reps each side)", "Elastico then sprint through a gate", "Slow-motion practice to perfect foot position"],
      videoUrl: null, isPopular: true
    },
    {
      name: "Body Feint", description: "Use shoulder drops and body shifts to send a defender the wrong way.", category: "dribbling", difficulty: "beginner", focus: null,
      steps: ["Approach the defender under control", "Drop your shoulder hard in one direction", "Shift your body weight convincingly that way", "Push the ball the other direction", "Accelerate through the gap created"],
      tips: ["Eye contact with the defender helps sell the feint", "Works best when the defender is standing still or planted", "Combine with a step over for extra deception"],
      commonMistakes: ["Feint is too subtle — defender doesn't bite", "Not accelerating after the feint", "Ball pushed too wide after the move"],
      practiceExercises: ["Body feint past cone drill (20 reps)", "1v1 feint game with partner (3 mins)", "Feint then cross/shot combination drill"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Nutmeg", description: "Push the ball through a defender's legs and sprint past them.", category: "dribbling", difficulty: "intermediate", focus: null,
      steps: ["Wait for the defender to open their stance", "Push the ball firmly between their legs", "Immediately sprint around them to collect", "Keep the pass weighted to emerge from the other side", "Sell it with a fake in the opposite direction first"],
      tips: ["Only attempt when the defender's legs are open", "Works best with a preceding body feint", "The collect after must be instant"],
      commonMistakes: ["Attempting when defender's legs are closed", "Ball not weighted correctly — defender recovers", "Sprinting the wrong side after the nutmeg"],
      practiceExercises: ["Nutmeg through cone gates (15 reps)", "Partner drill — nutmeg then sprint", "Nutmeg in small-sided games"],
      videoUrl: null, isPopular: true
    },
    {
      name: "V-Pull", description: "Pull the ball back with the sole and push sideways to change direction quickly.", category: "dribbling", difficulty: "beginner", focus: null,
      steps: ["Place your foot on top of the ball", "Drag the ball back toward you with the sole", "Immediately push the ball sideways with the inside of the same foot", "Transfer weight and accelerate in the new direction", "Keep head up throughout"],
      tips: ["The two motions should be one fluid movement", "Works well when a defender overcommits", "Change of pace after is critical"],
      commonMistakes: ["Ball dragged back too far", "Losing balance during the direction change", "Moving too slowly allows defender to recover"],
      practiceExercises: ["V-Pull around a stationary cone (20 reps each side)", "V-Pull into a sprint through cones", "V-Pull in small possession games"],
      videoUrl: null, isPopular: false
    },

    // DEFENDING
    {
      name: "Jockey Stance", description: "Use a side-on stance to channel attackers away from danger zones.", category: "defending", difficulty: "beginner", focus: null,
      steps: ["Stay 1-2 metres from the attacker", "Side-on body position — never square", "Keep your weight on your toes", "Force attacker toward your stronger side or the touchline", "Stay patient and wait for the right moment to tackle"],
      tips: ["Never dive in — stay on your feet", "Shepherd rather than tackle in your own half", "Small, quick steps to mirror the attacker"],
      commonMistakes: ["Getting too close allows the attacker to knock it past", "Flat-footed stance makes you easy to beat", "Committing too early"],
      practiceExercises: ["Jockey down a 10m channel with a dribbling partner", "1v1 defending drill — hold for 10 seconds", "Shadow jockey without the ball (15 reps)"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Slide Tackle", description: "Time a perfectly executed slide to win the ball cleanly.", category: "defending", difficulty: "advanced", focus: null,
      steps: ["Identify the perfect moment when attacker overextends", "Drop to the tackling leg", "Extend the tackling foot to reach the ball", "Lead with the heel to get under the ball", "Complete the slide away from the attacker"],
      tips: ["Only use as a last resort — stay on your feet first", "Make sure you win the ball, not the man", "Approach from the side, not head-on"],
      commonMistakes: ["Tackling from behind risks a red card", "Mistiming leaves attacker through on goal", "Attempting in your own penalty box is very risky"],
      practiceExercises: ["Slide to ball only drill on grass (no opponent) 10 reps", "Timed slide through a gate", "1v1 defending — only tackle when safe"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Interception", description: "Read the game to cut out passes before they reach the attacker.", category: "defending", difficulty: "intermediate", focus: null,
      steps: ["Watch the passer's body shape and eyes", "Position yourself to cover likely passing lanes", "Anticipate the pass a split second before it's played", "Step into the passing lane at the right moment", "Control the ball and play forward immediately"],
      tips: ["Position first — interceptions are won before the pass", "Don't gamble unless you're confident", "Fake press then drop to intercept"],
      commonMistakes: ["Moving too early telegraphs your intention", "Wrong positioning — wrong passing lane covered", "Not controlling well enough to retain possession"],
      practiceExercises: ["3v2 rondo — defender tries to intercept", "Passing lane reading drill with cones", "Shadow passing scenarios where you cut lanes"],
      videoUrl: null, isPopular: true
    },
    {
      name: "Standing Tackle", description: "Win the ball cleanly in a stationary 50-50 challenge.", category: "defending", difficulty: "intermediate", focus: null,
      steps: ["Stay on your feet and wait for your moment", "Plant your standing foot beside the ball", "Strike through the ball with your tackling foot", "Follow through to win the ball cleanly", "Immediately move with the ball after winning it"],
      tips: ["Timing is everything — don't lunge", "Win the ball, not the man", "Stay composed under pressure"],
      commonMistakes: ["Leading with arms or body instead of foot", "Mistimed challenge gives away a free kick", "Too far from attacker when challenging"],
      practiceExercises: ["50-50 standing tackle drill with partner", "Tackle and accelerate drill", "Timed tackling challenges in a grid"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Defensive Press", description: "Coordinate a high press to trap and win the ball from the opposition.", category: "defending", difficulty: "advanced", focus: null,
      steps: ["Trigger the press when attacker receives with their back to goal", "Sprint to close space immediately", "Cut off the attacker's passing options", "Teammate covers the escape route", "Force the error through relentless pressure"],
      tips: ["Pressing is a team movement — communication is vital", "Press at the right moment, not randomly", "Block the obvious passing lane as you press"],
      commonMistakes: ["Pressing without a trigger wastes energy", "Not cutting off passing lanes makes the press useless", "Individual press without teammates = you get turned"],
      practiceExercises: ["Pressing triggers drill — press on a signal (10 reps)", "3v3 pressing game in a small grid", "Counter-press drill after losing the ball"],
      videoUrl: null, isPopular: false
    },

    // HEADING
    {
      name: "Power Header", description: "Generate maximum force from a header using neck and core muscles.", category: "heading", difficulty: "intermediate", focus: null,
      steps: ["Take off from both feet or one foot depending on the ball", "Arch your back as the ball arrives", "Drive your neck and core forward", "Make contact with the forehead", "Direct to the target and follow through"],
      tips: ["The forehead is the most powerful and accurate surface", "Attack the ball — don't let it hit you", "Arms out for balance and height"],
      commonMistakes: ["Heading with the top of the head — painful and inaccurate", "Passive heading — waiting for ball to arrive", "Eyes closed on contact — loss of accuracy"],
      practiceExercises: ["Seated header drill (forehead contact) 20 reps", "Jump and power header from crosses", "Header from a running start into a target zone"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Defensive Header", description: "Clear aerial balls confidently away from danger in your defensive zone.", category: "heading", difficulty: "beginner", focus: null,
      steps: ["Attack the ball early rather than waiting", "Get in front of the attacker", "Strike through the bottom half of the ball to get height", "Direct the header wide or long away from goal", "Call for the header so teammates clear the area"],
      tips: ["Height and distance is more important than accuracy when clearing", "Win the header early — don't wait for the ball to drop", "Head toward the touchline to keep the play safe"],
      commonMistakes: ["Heading straight back toward goal", "Being beaten to the ball by standing still", "No communication with teammates"],
      practiceExercises: ["Defensive clearing header from crosses (15 reps)", "1v1 aerial duel practice", "Header and second ball reaction drill"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Glancing Header", description: "Redirect a cross with a subtle angled header into the net.", category: "heading", difficulty: "advanced", focus: null,
      steps: ["Attack the near post or far post run", "Time your run to arrive just as the ball does", "Get your neck and head to glance the ball", "Redirect with a subtle angle rather than power", "Aim into the opposite corner from where the cross came"],
      tips: ["Glancing headers are harder for goalkeepers to read", "The near-post glance is one of the most dangerous in football", "Accuracy > Power for the glancing header"],
      commonMistakes: ["Arriving too early allows defender to recover", "Too much head movement deflects ball unpredictably", "Poor run timing puts you in an offside position"],
      practiceExercises: ["Glancing header from wide crosses (10 reps each side)", "Near post run and redirect drill", "Full attack vs defence heading scenarios"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Diving Header", description: "Launch yourself horizontally to meet a low cross with your head.", category: "heading", difficulty: "advanced", focus: null,
      steps: ["Identify a low cross coming in at ground level", "Time your dive to meet the ball", "Launch your body horizontally forward", "Make contact with your forehead", "Cushion your fall with outstretched hands"],
      tips: ["Commitment is essential — no half-hearted dives", "Works best for crosses driven low and hard", "Safety first — practice on soft surfaces"],
      commonMistakes: ["Diving too early — ball reaches you when you're already on the floor", "Using the top of the head — injury risk", "Not protecting yourself when landing"],
      practiceExercises: ["Low cross diving header drill on soft ground", "Dive onto a cushion and header practice", "Full crossing and finishing drill"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Flick-On Header", description: "Use a subtle flick to redirect an aerial ball to a teammate in behind.", category: "heading", difficulty: "intermediate", focus: null,
      steps: ["Get in front of the cross or long ball", "Position your body between ball and defender", "Rather than attacking the ball, let it glance off your head", "Use a minimal flick to redirect into space", "Communicate with the player behind before the ball arrives"],
      tips: ["Your head barely needs to move — let the ball do the work", "Works brilliantly from goal kicks and long balls", "The player behind must be anticipating the flick"],
      commonMistakes: ["Too much head movement — ball goes too far", "No communication with target runner", "Attempting when too tight to defenders"],
      practiceExercises: ["Flick-on header relay in groups of 3", "Goal kick flick-on drill with a striker", "Aerial flick-on then finish combination"],
      videoUrl: null, isPopular: false
    },

    // OPPOSITE FOOT
    {
      name: "Weak Foot Wall Pass", description: "Build touch and confidence on your weaker foot with wall passing.", category: "opposite-foot", difficulty: "beginner", focus: "left",
      steps: ["Stand 2-3 metres from a wall", "Pass only with your weaker foot", "Control the return and pass again immediately", "Focus on inside of foot contact", "Increase pace as confidence grows"],
      tips: ["Consistency matters more than power at first", "Do this for 10 minutes every training session", "Track your accuracy rate and try to improve it"],
      commonMistakes: ["Reverting to the strong foot when it gets difficult", "Not focusing on technique — just kicking randomly", "Quitting when the weaker foot feels uncomfortable"],
      practiceExercises: ["100 passes against a wall with weak foot daily", "Weak foot only passing circuit (15 mins)", "Alternating wall passes (weak foot only)"],
      videoUrl: "https://www.youtube.com/watch?v=vM4zJWvLiJU", isPopular: false
    },
    {
      name: "Weak Foot Shooting", description: "Generate power and accuracy when shooting with your non-dominant foot.", category: "opposite-foot", difficulty: "intermediate", focus: "left",
      steps: ["Plant your strong foot beside the ball", "Lock the ankle on your weak foot firmly", "Strike with the laces through the centre", "Follow through toward the target", "Start from close range and move back gradually"],
      tips: ["Shoot from 5m until you can hit targets consistently, then move to 10m", "Power will come — focus on accuracy first", "Film yourself to spot technique errors"],
      commonMistakes: ["Striking with the toe instead of the laces", "Not following through — kills power", "Giving up after mishitting — persistence is required"],
      practiceExercises: ["10 stationary shots at target from 10m (weak foot only)", "Moving ball weak foot strikes (8 reps)", "Weak foot shooting after dribbling through cones"],
      videoUrl: null, isPopular: true
    },
    {
      name: "Weak Foot Crossing", description: "Deliver accurate crosses from your non-dominant side.", category: "opposite-foot", difficulty: "intermediate", focus: "left",
      steps: ["Run onto the ball at the byline on your weak side", "Approach at a curved angle to open your body", "Strike through the bottom half with your instep", "Get your head over the ball to keep it low", "Target the penalty spot area or far post"],
      tips: ["Open body position is crucial for a good weak foot cross", "Practice low, driven crosses first before attempting in-swingers", "Repetition is the only way — no shortcuts"],
      commonMistakes: ["Body position too closed makes the cross go behind", "Under-hit crosses are easy for keepers", "Targeting wrong areas of the box"],
      practiceExercises: ["Stationary ball crossing from the byline — weak foot (15 reps)", "Moving run and cross drill (weak foot only)", "Cross and finish combination with a striker"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Weak Foot Dribbling", description: "Develop close ball control and dribbling ability with your non-dominant foot.", category: "opposite-foot", difficulty: "beginner", focus: "left",
      steps: ["Set up a slalom cone course", "Dribble using only your weaker foot", "Use inside and outside of the foot", "Focus on tight touches to keep control", "Increase speed gradually as comfort grows"],
      tips: ["Alternate inside and outside touches for natural movement", "Don't look down — trust your touch", "Start slowly — speed will come naturally"],
      commonMistakes: ["Rushing and losing control — start at walking pace", "Only using inside of foot — limits your ability", "Avoiding the weak foot in real situations after training"],
      practiceExercises: ["Slalom course — weak foot only (5 reps)", "Square dribbling pattern with weak foot (3 reps)", "Weak foot only small-sided game (10 minutes)"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Weak Foot First Touch", description: "Train your weaker foot to cleanly control all types of passes.", category: "opposite-foot", difficulty: "beginner", focus: "left",
      steps: ["Ask a partner to pass at varying heights and pace", "Cushion all passes with your weak foot only", "Control to your weak side, then your strong side", "Move the ball to a comfortable position in one touch", "React quickly — make it game-speed"],
      tips: ["Relax the foot on contact for a cushioned touch", "Mix up receiving surfaces — instep, outside, sole", "Start slow, increase pace week by week"],
      commonMistakes: ["Using strong foot instinctively under pressure", "Not relaxing the foot — ball bounces away", "Only practicing from one passing angle"],
      practiceExercises: ["Weak foot first touch and pass back (25 reps)", "Weak foot control under light pressure", "Partner random passes — weak foot control only (15 mins)"],
      videoUrl: null, isPopular: false
    },
    {
      name: "Weak Foot One-Two", description: "Play quick combinations using only your weaker foot with a partner.", category: "opposite-foot", difficulty: "intermediate", focus: "left",
      steps: ["Play a firm pass with weak foot to your partner", "Sprint to receive the return pass", "Control with weak foot on the move", "Play the return pass immediately with weak foot", "Increase the pace of combinations progressively"],
      tips: ["Communication with partner is vital", "Keep touches minimal and sharp", "This replicates real match conditions perfectly"],
      commonMistakes: ["Slowing down between passes — must stay sharp", "Switching to strong foot when uncomfortable", "Not sprinting to receive — makes the drill too easy"],
      practiceExercises: ["One-two relay — weak foot only (15 reps)", "Moving one-two drill over 20m", "One-two into a shot with weak foot finish"],
      videoUrl: null, isPopular: false
    },
  ];

  for (const t of techniques) {
    await client.query(
      `INSERT INTO techniques (name, description, category, difficulty, focus, steps, tips, common_mistakes, practice_exercises, video_url, is_popular)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [t.name, t.description, t.category, t.difficulty, t.focus || null, t.steps, t.tips, t.commonMistakes, t.practiceExercises, t.videoUrl || null, t.isPopular]
    );
  }
}

async function seedTrainingData(client: any) {
  const programs = [
    {
      name: "Explosive Power Program",
      description: "Build elite explosive power to dominate every sprint, jump, and tackle on the pitch.",
      category: "Strength & Power", difficulty: "advanced", duration: "8 weeks",
      workoutsPerWeek: 4, focusArea: "lower_body", targetMuscles: "3", type: "explosive",
      benefits: ["Increased sprint speed", "Better jump height", "More powerful shots", "Faster acceleration"],
    },
    {
      name: "Opposite Foot Mastery",
      description: "Develop elite-level skill with your weaker foot to become a truly two-footed player.",
      category: "Technical Skills", difficulty: "intermediate", duration: "6 weeks",
      workoutsPerWeek: 5, focusArea: "technique", targetMuscles: "4", type: "technique",
      benefits: ["Complete two-footed player", "Unpredictable in tight spaces", "More shooting options", "Better balance"],
    },
    {
      name: "Cardio Endurance Base",
      description: "Build the aerobic engine you need to dominate the full 90 minutes and beyond.",
      category: "Fitness & Conditioning", difficulty: "beginner", duration: "6 weeks",
      workoutsPerWeek: 4, focusArea: "cardio", targetMuscles: "3", type: "cardio",
      benefits: ["90-minute stamina", "Faster recovery", "Better concentration late in games", "Reduced injury risk"],
    },
    {
      name: "Plyometric Training",
      description: "Advanced plyometric exercises to develop fast-twitch muscle fibers for explosive movement.",
      category: "Athletic Performance", difficulty: "advanced", duration: "4 weeks",
      workoutsPerWeek: 3, focusArea: "full_body", targetMuscles: "5", type: "plyometric",
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
      { name: "Power Squat Circuit", description: "Heavy compound lower body training with explosive concentric phase", duration: "45", focusArea: "Lower Body",
        exercises: [{ name: "Back Squat", sets: 4, reps: "6" }, { name: "Box Jumps", sets: 4, reps: "8" }, { name: "Romanian Deadlift", sets: 3, reps: "8" }, { name: "Leg Press", sets: 3, reps: "10" }] },
      { name: "Sprint & Acceleration", description: "Sprint drills focused on acceleration and top-end speed", duration: "40", focusArea: "Speed",
        exercises: [{ name: "10m Acceleration Sprints", sets: 6, reps: "1" }, { name: "30m Flying Sprints", sets: 4, reps: "1" }, { name: "Cone Agility Drills", sets: 3, reps: "5" }, { name: "Resisted Band Sprints", sets: 4, reps: "1" }] },
    ];
  } else if (type === "technique") {
    return [
      { name: "Weak Foot Passing Drills", description: "Progressive passing exercises using only your weaker foot", duration: "35", focusArea: "Ball Control",
        exercises: [{ name: "Wall Pass (Weak Foot)", sets: 3, reps: "20" }, { name: "Short Pass Combinations", sets: 3, reps: "15" }, { name: "Long Ball Distribution", sets: 3, reps: "10" }, { name: "One-Touch Pass Drill", sets: 4, reps: "12" }] },
      { name: "Weak Foot Shooting", description: "Shooting drills to build power and accuracy with your weaker foot", duration: "40", focusArea: "Finishing",
        exercises: [{ name: "Stationary Shooting (Weak)", sets: 4, reps: "10" }, { name: "Moving Shooting Drill", sets: 3, reps: "8" }, { name: "Turn and Shoot", sets: 3, reps: "6" }, { name: "Volleys (Weak Foot)", sets: 3, reps: "8" }] },
    ];
  } else if (type === "cardio") {
    return [
      { name: "Aerobic Base Run", description: "Steady-state aerobic running to build endurance base", duration: "50", focusArea: "Cardiovascular",
        exercises: [{ name: "Warm-up Jog", sets: 1, reps: "10 min" }, { name: "Steady State Run (70% HR)", sets: 1, reps: "30 min" }, { name: "Cool Down Walk", sets: 1, reps: "10 min" }] },
      { name: "Interval Training", description: "High-intensity intervals to boost VO2 max and match fitness", duration: "45", focusArea: "Stamina",
        exercises: [{ name: "High Knee Intervals", sets: 6, reps: "30s on / 30s off" }, { name: "Shuttle Runs", sets: 5, reps: "1" }, { name: "Burpees", sets: 4, reps: "10" }, { name: "Mountain Climbers", sets: 4, reps: "20" }] },
    ];
  } else {
    return [
      { name: "Plyometric Jump Circuit", description: "Advanced jumping and reactive training for explosive athletic performance", duration: "40", focusArea: "Power",
        exercises: [{ name: "Depth Jumps", sets: 4, reps: "6" }, { name: "Broad Jumps", sets: 4, reps: "5" }, { name: "Lateral Bounds", sets: 3, reps: "8" }, { name: "Single-Leg Box Hops", sets: 3, reps: "8" }] },
      { name: "Reactive Agility Drills", description: "Reactive drills that develop fast-twitch responses and change of direction speed", duration: "35", focusArea: "Agility",
        exercises: [{ name: "Ladder Drills", sets: 4, reps: "1 length" }, { name: "T-Agility Test", sets: 4, reps: "1" }, { name: "4-Cone Drill", sets: 5, reps: "1" }, { name: "Pro Agility Shuttle", sets: 4, reps: "1" }] },
    ];
  }
}
