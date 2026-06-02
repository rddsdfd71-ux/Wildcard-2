import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useProgression } from '@/hooks/useProgression';
import { userSessionManager } from '@/lib/userSession';

interface Exercise {
  name: string;
  reps: string;
}

interface Workout {
  id: number;
  name: string;
  description: string;
  duration: number; // in minutes
  exercises: Exercise[];
  focusArea: string;
}

interface WorkoutCardProps {
  workout: Workout;
  index: number;
}

const WorkoutCard: FC<WorkoutCardProps> = ({ workout, index }) => {
  const currentUserId = userSessionManager.getNumericUserId();
  const { timerState, startWorkout, finishWorkout, cancelWorkout, formatTime } = useWorkoutTimer(currentUserId);
  const { completeWorkout, isCompletingWorkout } = useProgression(currentUserId);

  const handleStartWorkout = () => {
    startWorkout(workout.id, workout.name, workout.duration, 'intermediate');
  };

  const handleFinishWorkout = async () => {
    if (!timerState.canFinish) return;
    
    try {
      finishWorkout();
      
      // Complete the workout in the progression system
      completeWorkout({
        workoutType: workout.name,
        duration: workout.duration,
        difficulty: 'intermediate',
        exercises: workout.exercises.length,
        performanceRating: 4, // Default good performance
      });
    } catch (error) {
      console.error("Error finishing workout:", error);
    }
  };

  const isWorkoutActive = timerState.isActive;
  const showTimer = timerState.isActive || timerState.progress > 0;

  return (
    <Card className="bg-[#1a1a1a] border-[#333] hover:border-[#FF6B00] transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center font-['Oswald'] font-bold text-black">
              {index + 1}
            </div>
            <div>
              <h3 className="font-['Oswald'] text-xl text-white mb-1">{workout.name}</h3>
              <div className="flex items-center text-sm text-gray-400">
                <i className="fas fa-clock mr-2"></i>
                {workout.duration} min
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4">{workout.description}</p>

        {/* Timer Display */}
        {showTimer && (
          <div className="mb-4 p-4 bg-[#0f0f0f] rounded-lg border border-[#333]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Workout Progress</span>
              <span className="font-['Oswald'] text-[#FF6B00] text-lg">
                {formatTime(timerState.timeRemaining)}
              </span>
            </div>
            <Progress value={timerState.progress} className="mb-2" />
            <div className="text-xs text-center text-gray-500">
              {timerState.progress < 90 
                ? `${Math.round(timerState.progress)}% complete - Keep going!`
                : 'Ready to finish! 🎯'
              }
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="mb-4">
          <h4 className="text-[#FF6B00] font-['Oswald'] text-sm mb-3">Exercises:</h4>
          <div className="space-y-2">
            {workout.exercises.map((exercise, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-[#0f0f0f] rounded border border-[#333]">
                <span className="text-sm text-gray-300">{idx + 1}. {exercise.name}</span>
                <span className="text-xs text-[#FF6B00] font-bold">{exercise.reps}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isWorkoutActive && timerState.progress === 0 && (
            <Button 
              onClick={handleStartWorkout}
              className="w-full bg-[#FF6B00] hover:bg-[#FF8533] text-black font-['Oswald'] font-bold py-3"
            >
              <i className="fas fa-play mr-2"></i>
              Start Workout
            </Button>
          )}

          {isWorkoutActive && (
            <div className="flex space-x-2">
              <Button 
                onClick={handleFinishWorkout}
                disabled={!timerState.canFinish || isCompletingWorkout}
                className={`flex-1 font-['Oswald'] font-bold py-3 ${
                  timerState.canFinish 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <i className="fas fa-check mr-2"></i>
                {isCompletingWorkout ? 'Finishing...' : 'Finish Workout'}
              </Button>
              <Button 
                onClick={cancelWorkout}
                variant="outline"
                className="px-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
          )}

          {!isWorkoutActive && timerState.progress === 100 && (
            <div className="text-center p-3 bg-green-900/20 border border-green-600 rounded-lg">
              <i className="fas fa-check-circle text-green-500 mr-2"></i>
              <span className="text-green-400 font-['Oswald']">Workout Completed!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutCard;