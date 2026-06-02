import { FC, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import MealCard from "@/components/nutrition/MealCard";

const Nutrition: FC = () => {
  // Generate daily meal plan based on current day
  const dailyMealPlan = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    const mealPlans = [
      {
        // Sunday - Recovery Day
        day: "Sunday",
        theme: "Recovery & Repair",
        tagline: "RECOVERY DAY",
        breakfast: {
          name: "Recovery Protein Bowl",
          description: "Oatmeal, Greek yogurt, Blueberries, Almonds, Honey",
          calories: 580,
          protein: 35,
          carbs: 65,
          icon: "🥣"
        },
        preWorkout: {
          name: "Light Energy Boost",
          description: "Green tea, Banana, Handful of dates",
          calories: 220,
          protein: 5,
          carbs: 55,
          icon: "🍌"
        },
        postWorkout: {
          name: "Recovery Smoothie",
          description: "Protein powder, Spinach, Pineapple, Coconut water",
          calories: 320,
          protein: 30,
          carbs: 35,
          icon: "🥤"
        },
        dinner: {
          name: "Salmon & Sweet Potato",
          description: "Grilled salmon, Roasted sweet potato, Steamed broccoli",
          calories: 650,
          protein: 45,
          carbs: 55,
          icon: "🐟"
        }
      },
      {
        // Monday - High Intensity Start
        day: "Monday",
        theme: "High Intensity Training",
        tagline: "POWER START",
        breakfast: {
          name: "High Protein Breakfast Bowl",
          description: "Eggs, Oatmeal, Greek yogurt, Berries, Nuts",
          calories: 660,
          protein: 40,
          carbs: 65,
          icon: "🥚"
        },
        preWorkout: {
          name: "Energy-Boosting Snack",
          description: "Banana, Whole grain toast, Almond butter",
          calories: 320,
          protein: 10,
          carbs: 45,
          icon: "🍎"
        },
        postWorkout: {
          name: "Recovery Protein Shake",
          description: "Whey protein, Banana, Spinach, Almond milk, Honey",
          calories: 380,
          protein: 35,
          carbs: 40,
          icon: "🥛"
        },
        dinner: {
          name: "Athlete's Power Plate",
          description: "Chicken breast, Quinoa, Mixed vegetables, Avocado",
          calories: 720,
          protein: 50,
          carbs: 60,
          icon: "🍗"
        }
      },
      {
        // Tuesday - Endurance Focus
        day: "Tuesday",
        theme: "Endurance Training",
        tagline: "ENDURANCE FUEL",
        breakfast: {
          name: "Endurance Energy Bowl",
          description: "Steel-cut oats, Chia seeds, Banana, Peanut butter",
          calories: 620,
          protein: 25,
          carbs: 85,
          icon: "🥣"
        },
        preWorkout: {
          name: "Carb-Loading Snack",
          description: "Rice cakes, Honey, Sliced apple",
          calories: 280,
          protein: 5,
          carbs: 70,
          icon: "🍚"
        },
        postWorkout: {
          name: "Endurance Recovery",
          description: "Chocolate milk, Protein bar, Fresh berries",
          calories: 420,
          protein: 25,
          carbs: 55,
          icon: "🍫"
        },
        dinner: {
          name: "Pasta Power Bowl",
          description: "Whole grain pasta, Lean ground turkey, Marinara, Vegetables",
          calories: 680,
          protein: 40,
          carbs: 85,
          icon: "🍝"
        }
      },
      {
        // Wednesday - Strength Focus
        day: "Wednesday",
        theme: "Strength Building",
        tagline: "STRENGTH DAY",
        breakfast: {
          name: "Muscle Builder Plate",
          description: "Scrambled eggs, Turkey sausage, Whole grain toast",
          calories: 640,
          protein: 45,
          carbs: 50,
          icon: "🍳"
        },
        preWorkout: {
          name: "Power Pre-Workout",
          description: "Greek yogurt, Granola, Mixed berries",
          calories: 350,
          protein: 20,
          carbs: 45,
          icon: "🫐"
        },
        postWorkout: {
          name: "Muscle Recovery Shake",
          description: "Casein protein, Creatine, Milk, Banana",
          calories: 400,
          protein: 40,
          carbs: 35,
          icon: "💪"
        },
        dinner: {
          name: "Steak & Potatoes",
          description: "Lean beef, Baked potato, Green beans, Side salad",
          calories: 750,
          protein: 55,
          carbs: 65,
          icon: "🥩"
        }
      },
      {
        // Thursday - Speed & Agility
        day: "Thursday",
        theme: "Speed & Agility",
        tagline: "SPEED TRAINING",
        breakfast: {
          name: "Quick Energy Bowl",
          description: "Smoothie bowl, Granola, Fresh fruit, Coconut flakes",
          calories: 580,
          protein: 25,
          carbs: 75,
          icon: "🥥"
        },
        preWorkout: {
          name: "Speed Fuel",
          description: "Energy bar, Sports drink, Orange slices",
          calories: 300,
          protein: 10,
          carbs: 65,
          icon: "🍊"
        },
        postWorkout: {
          name: "Quick Recovery",
          description: "Protein shake, Electrolyte drink, Apple",
          calories: 350,
          protein: 30,
          carbs: 40,
          icon: "⚡"
        },
        dinner: {
          name: "Fish & Rice Bowl",
          description: "Grilled tilapia, Brown rice, Stir-fried vegetables",
          calories: 650,
          protein: 40,
          carbs: 70,
          icon: "🐠"
        }
      },
      {
        // Friday - Technical Skills
        day: "Friday",
        theme: "Technical Training",
        tagline: "SKILL FOCUS",
        breakfast: {
          name: "Focus Fuel Bowl",
          description: "Quinoa porridge, Nuts, Seeds, Fresh berries",
          calories: 590,
          protein: 30,
          carbs: 70,
          icon: "🌰"
        },
        preWorkout: {
          name: "Brain & Body Fuel",
          description: "Trail mix, Green smoothie, Coconut water",
          calories: 310,
          protein: 12,
          carbs: 50,
          icon: "🥥"
        },
        postWorkout: {
          name: "Skill Recovery",
          description: "Plant protein shake, Chia pudding, Mango",
          calories: 370,
          protein: 28,
          carbs: 45,
          icon: "🥭"
        },
        dinner: {
          name: "Mediterranean Plate",
          description: "Grilled chicken, Couscous, Hummus, Mediterranean salad",
          calories: 690,
          protein: 45,
          carbs: 65,
          icon: "🫒"
        }
      },
      {
        // Saturday - Match/Competition Day
        day: "Saturday",
        theme: "Competition Day",
        tagline: "GAME DAY",
        breakfast: {
          name: "Champion's Breakfast",
          description: "Whole grain pancakes, Turkey bacon, Fresh fruit",
          calories: 650,
          protein: 35,
          carbs: 80,
          icon: "🥞"
        },
        preWorkout: {
          name: "Game Day Fuel",
          description: "Energy gel, Sports drink, Banana",
          calories: 280,
          protein: 5,
          carbs: 70,
          icon: "🏆"
        },
        postWorkout: {
          name: "Victory Recovery",
          description: "Chocolate protein shake, Energy bar, Berries",
          calories: 450,
          protein: 35,
          carbs: 50,
          icon: "🥇"
        },
        dinner: {
          name: "Winner's Feast",
          description: "Grilled steak, Garlic mashed potatoes, Roasted vegetables",
          calories: 780,
          protein: 60,
          carbs: 70,
          icon: "👑"
        }
      }
    ];
    
    return {
      ...mealPlans[dayOfWeek],
      dateString,
      totalCalories: mealPlans[dayOfWeek].breakfast.calories + 
                    mealPlans[dayOfWeek].preWorkout.calories + 
                    mealPlans[dayOfWeek].postWorkout.calories + 
                    mealPlans[dayOfWeek].dinner.calories,
      totalProtein: mealPlans[dayOfWeek].breakfast.protein + 
                   mealPlans[dayOfWeek].preWorkout.protein + 
                   mealPlans[dayOfWeek].postWorkout.protein + 
                   mealPlans[dayOfWeek].dinner.protein,
      totalCarbs: mealPlans[dayOfWeek].breakfast.carbs + 
                 mealPlans[dayOfWeek].preWorkout.carbs + 
                 mealPlans[dayOfWeek].postWorkout.carbs + 
                 mealPlans[dayOfWeek].dinner.carbs
    };
  }, []);

  // Calculate total fats (estimated as 25-30% of total calories)
  const totalFats = Math.round(dailyMealPlan.totalCalories * 0.25 / 9);
  
  return (
    <section className="tab-content animate-in slide-in-from-left duration-300">
      <div className="mb-6">
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">Nutrition Plan</h2>
        
        {/* Nutrition Overview */}
        <Card className="bg-[#000000] rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00]">{dailyMealPlan.dateString}</h3>
              <p className="text-xs opacity-70">{dailyMealPlan.theme}</p>
            </div>
            <span className="bg-[#FF6B00] px-2 py-1 rounded text-xs text-black font-bold">{dailyMealPlan.tagline}</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-[#2A2A2A] rounded p-3 text-center">
              <div className="text-xs opacity-70">Calories</div>
              <div className="font-['Oswald'] text-lg text-[#FF9E2C]">{dailyMealPlan.totalCalories}</div>
            </div>
            <div className="bg-[#2A2A2A] rounded p-3 text-center">
              <div className="text-xs opacity-70">Protein</div>
              <div className="font-['Oswald'] text-lg text-[#FF9E2C]">{dailyMealPlan.totalProtein}g</div>
            </div>
            <div className="bg-[#2A2A2A] rounded p-3 text-center">
              <div className="text-xs opacity-70">Carbs</div>
              <div className="font-['Oswald'] text-lg text-[#FF9E2C]">{dailyMealPlan.totalCarbs}g</div>
            </div>
            <div className="bg-[#2A2A2A] rounded p-3 text-center">
              <div className="text-xs opacity-70">Fats</div>
              <div className="font-['Oswald'] text-lg text-[#FF9E2C]">{totalFats}g</div>
            </div>
          </div>
          
          <p className="text-sm opacity-70 mb-3">Optimized for {dailyMealPlan.theme.toLowerCase()} and peak performance.</p>
        </Card>
        
        {/* Daily Meal Plan */}
        <div className="space-y-4">
          {/* Breakfast */}
          <Card className="bg-[#000000] rounded-lg overflow-hidden border border-[#FF6B00]/20">
            <div className="bg-[#FF6B00] px-4 py-2">
              <h3 className="font-['Montserrat'] text-sm font-bold text-black uppercase tracking-wide">BREAKFAST</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{dailyMealPlan.breakfast.icon}</span>
                  <div>
                    <h4 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00]">{dailyMealPlan.breakfast.name}</h4>
                    <p className="text-sm opacity-70">{dailyMealPlan.breakfast.description}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🔥 {dailyMealPlan.breakfast.calories} calories</div>
                </div>
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🥩 {dailyMealPlan.breakfast.protein}g protein</div>
                </div>
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🌾 {dailyMealPlan.breakfast.carbs}g carbs</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Pre-Workout */}
          <Card className="bg-[#000000] rounded-lg overflow-hidden border border-[#FF6B00]/20">
            <div className="bg-[#FF6B00] px-4 py-2">
              <h3 className="font-['Montserrat'] text-sm font-bold text-black uppercase tracking-wide">PRE-WORKOUT</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{dailyMealPlan.preWorkout.icon}</span>
                  <div>
                    <h4 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00]">{dailyMealPlan.preWorkout.name}</h4>
                    <p className="text-sm opacity-70">{dailyMealPlan.preWorkout.description}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🔥 {dailyMealPlan.preWorkout.calories} calories</div>
                </div>
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🥩 {dailyMealPlan.preWorkout.protein}g protein</div>
                </div>
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🌾 {dailyMealPlan.preWorkout.carbs}g carbs</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Post-Workout */}
          <Card className="bg-[#000000] rounded-lg overflow-hidden border border-[#FF6B00]/20">
            <div className="bg-[#FF6B00] px-4 py-2">
              <h3 className="font-['Montserrat'] text-sm font-bold text-black uppercase tracking-wide">POST-WORKOUT</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{dailyMealPlan.postWorkout.icon}</span>
                  <div>
                    <h4 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00]">{dailyMealPlan.postWorkout.name}</h4>
                    <p className="text-sm opacity-70">{dailyMealPlan.postWorkout.description}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🔥 {dailyMealPlan.postWorkout.calories} calories</div>
                </div>
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🥩 {dailyMealPlan.postWorkout.protein}g protein</div>
                </div>
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🌾 {dailyMealPlan.postWorkout.carbs}g carbs</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Dinner */}
          <Card className="bg-[#000000] rounded-lg overflow-hidden border border-[#FF6B00]/20">
            <div className="bg-[#FF6B00] px-4 py-2">
              <h3 className="font-['Montserrat'] text-sm font-bold text-black uppercase tracking-wide">DINNER</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{dailyMealPlan.dinner.icon}</span>
                  <div>
                    <h4 className="font-['Montserrat'] text-lg font-bold text-[#FF6B00]">{dailyMealPlan.dinner.name}</h4>
                    <p className="text-sm opacity-70">{dailyMealPlan.dinner.description}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🔥 {dailyMealPlan.dinner.calories} calories</div>
                </div>
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🥩 {dailyMealPlan.dinner.protein}g protein</div>
                </div>
                <div className="bg-[#2A2A2A] rounded p-2 text-center">
                  <div className="text-xs opacity-70">🌾 {dailyMealPlan.dinner.carbs}g carbs</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Nutrition;
