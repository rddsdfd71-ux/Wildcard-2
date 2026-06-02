import { FC, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useProgression } from "@/hooks/useProgression";
import TrainingCard from "@/components/training/TrainingCard";
import WorkoutItem from "@/components/training/WorkoutItem";
import WorkoutCard from "@/components/training/WorkoutCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { userSessionManager } from "@/lib/userSession";

const Training: FC = () => {
  const { id } = useParams();
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>("");
  const { toast } = useToast();
  
  const currentUserId = userSessionManager.getNumericUserId();
  
  const { completeWorkout, isCompletingWorkout, workoutResult } = useProgression(currentUserId);
  
  useEffect(() => {
    if (workoutResult) {
      toast({
        title: "🎉 Level Up!",
        description: `${workoutResult.message} ${workoutResult.levelUps > 0 ? `🎯 ${workoutResult.levelUps} skill(s) leveled up!` : ''}`,
      });
      
      if (workoutResult.rewards && workoutResult.rewards.length > 0) {
        workoutResult.rewards.forEach((reward, index) => {
          setTimeout(() => {
            toast({
              title: `🏆 ${reward.category}`,
              description: `${reward.message} +${reward.xpGained} XP earned!`,
            });
          }, (index + 1) * 1000);
        });
      }
    }
  }, [workoutResult, toast]);
  
  const { data: trainingPrograms, isLoading: loadingPrograms } = useQuery({
    queryKey: ["/api/training-programs"],
    refetchOnMount: true,
    staleTime: 0,
  });
  
  const { data: todaysWorkouts, isLoading: loadingWorkouts } = useQuery({
    queryKey: ["/api/workouts"],
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: trainingProgress } = useQuery({
    queryKey: ['/api/users', currentUserId, 'training-programs', 1, 'progress'],
    queryFn: () => fetch(`/api/users/${currentUserId}/training-programs/1/progress`).then(res => res.json()),
  });

  const trainingProgramsArray = (trainingPrograms as any[]) || [];
  const todaysWorkoutsArray = (todaysWorkouts as any[]) || [];

  const handlePlayVideo = (videoUrl: string, exerciseName: string) => {
    const videoId = videoUrl.split('v=')[1]?.split('&')[0] || "";
    
    if (videoId) {
      setCurrentVideo(videoId);
      setCurrentVideoTitle(exerciseName);
      setVideoDialogOpen(true);
    }
  };

  const { data: allWorkouts } = useQuery({
    queryKey: ["/api/workouts"],
  });

  if (id) {
    const program = Array.isArray(trainingPrograms) ? trainingPrograms.find((p: any) => p.id === parseInt(id)) : null;
    const programWorkouts = Array.isArray(allWorkouts) ? allWorkouts.filter((w: any) => w.trainingProgramId === parseInt(id)) : [];
    
    if (loadingPrograms) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto mb-2"></div>
            <p className="text-[#E0E0E0]">Loading program...</p>
          </div>
        </div>
      );
    }
    
    if (!program) {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-[#FF6B00] mb-4">Program Not Found</h2>
          <p className="text-[#E0E0E0] mb-4">The requested training program could not be found.</p>
          <Link href="/training">
            <Button className="bg-[#FF6B00] hover:bg-[#FF6B00]/80 text-black font-bold">
              Back to Training
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <section className="tab-content animate-in slide-in-from-left duration-300">
        <div className="mb-6">
          <Link href="/training">
            <Button variant="ghost" className="text-[#FF6B00] hover:text-[#FF6B00]/80 mb-4">
              ← Back to Training
            </Button>
          </Link>
          <h2 className="font-['Montserrat'] text-2xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">
            {program.name}
          </h2>
          <p className="text-[#E0E0E0] mb-6">{program.description}</p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#FF6B00] text-black text-sm font-bold rounded-full">
                    {program.category}
                  </span>
                  <span className="px-3 py-1 bg-[#2A2A2A] text-[#E0E0E0] text-sm rounded-full">
                    {program.difficulty}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#FF6B00] font-bold">DURATION</div>
                  <div className="text-lg font-bold">{program.duration}</div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-[#FF6B00] mb-3">{program.name}</h3>
              <p className="text-[#E0E0E0] text-lg mb-6">{program.description}</p>
              
              <div className="grid grid-cols-3 gap-4 p-4 bg-[#000000] rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF6B00]">{program.workoutsPerWeek}</div>
                  <div className="text-sm text-[#E0E0E0]">Workouts/Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF6B00]">{programWorkouts.length}</div>
                  <div className="text-sm text-[#E0E0E0]">Total Workouts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF6B00]">{program.targetMuscles}</div>
                  <div className="text-sm text-[#E0E0E0]">Focus Areas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardContent className="p-6">
              <h4 className="font-bold text-[#FF6B00] text-xl mb-4 flex items-center">
                <i className="fas fa-dumbbell mr-3"></i>
                Program Workouts
              </h4>
              {programWorkouts.length > 0 ? (
                <div className="grid gap-6">
                  {programWorkouts.map((workout: any, index: number) => (
                    <WorkoutCard
                      key={workout.id}
                      workout={{
                        id: workout.id,
                        name: workout.name,
                        description: workout.description,
                        duration: workout.duration,
                        exercises: workout.exercises?.map((ex: any) => ({
                          name: ex.name,
                          reps: ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : (ex.reps || '10x3')
                        })) || [],
                        focusArea: workout.focusArea || 'General'
                      }}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-dumbbell text-[#FF6B00] text-4xl mb-4"></i>
                  <p className="text-[#E0E0E0]">No workouts found for this program.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {program.benefits && program.benefits.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardContent className="p-6">
                <h4 className="font-bold text-[#FF6B00] text-xl mb-4 flex items-center">
                  <i className="fas fa-trophy mr-3"></i>
                  Program Benefits
                </h4>
                <div className="grid gap-3">
                  {program.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-[#000000] rounded-lg">
                      <i className="fas fa-check-circle text-[#FF6B00] mt-1 flex-shrink-0"></i>
                      <p className="text-[#E0E0E0]">{benefit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    );
  }
  
  return (
    <section className="tab-content animate-in slide-in-from-left duration-300">
      <div className="mb-6">
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">Training Center</h2>
        
        <div className="space-y-6">
          {/* Week Progress */}
          <Card className="bg-[#000000] rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-['Oswald'] text-lg">
                Week {trainingProgress?.currentWeek || 1} of {trainingProgress?.totalWeeks || 12}
              </span>
              <span className="text-[#FF6B00] font-bold">Progressive Plan</span>
            </div>
            <div className="w-full bg-[#2A2A2A] rounded-full h-2 mb-1">
              <div 
                className="bg-gradient-to-r from-[#FF6B00] to-[#FF9E2C] h-2 rounded-full" 
                style={{ width: `${trainingProgress?.progressPercentage || 8}%` }}
              ></div>
            </div>
          </Card>
          
          {/* Training Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingPrograms ? (
              <div className="col-span-full text-center py-8">
                <i className="fas fa-spinner fa-spin text-[#FF6B00] text-3xl mb-2"></i>
                <p>Loading training programs...</p>
              </div>
            ) : (
              trainingProgramsArray.map((program: any) => (
                <TrainingCard
                  key={program.id}
                  id={program.id}
                  name={program.name}
                  description={program.description}
                  workoutsPerWeek={program.workoutsPerWeek}
                  focusArea={program.focusArea.replace('_', ' & ')}
                  icon={program.type === "explosive" ? "bolt" : 
                        program.type === "plyometric" ? "running" : 
                        program.type === "cardio" ? "heartbeat" : "dumbbell"}
                />
              ))
            )}
          </div>
          
          {/* Available Workouts */}
          <div className="space-y-6">
            <h3 className="font-['Montserrat'] text-lg font-bold uppercase text-[#FF6B00] flex items-center">
              <i className="fas fa-dumbbell mr-3"></i>
              Available Workouts
            </h3>
            
            {loadingWorkouts ? (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 text-center">
                  <i className="fas fa-spinner fa-spin text-[#FF6B00] text-3xl mb-4"></i>
                  <p>Loading workouts...</p>
                </CardContent>
              </Card>
            ) : todaysWorkoutsArray.length > 0 ? (
              todaysWorkoutsArray.slice(0, 4).map((workout: any, index: number) => (
                <WorkoutCard
                  key={workout.id}
                  workout={{
                    id: workout.id,
                    name: workout.name,
                    description: workout.description,
                    duration: workout.duration,
                    exercises: workout.exercises?.map((ex: any) => ({
                      name: ex.name,
                      reps: ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : (ex.reps || '10x3')
                    })) || [],
                    focusArea: workout.focusArea || 'Today\'s Focus'
                  }}
                  index={index}
                />
              ))
            ) : (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 text-center">
                  <i className="fas fa-dumbbell text-[#FF6B00] text-4xl mb-4"></i>
                  <p className="text-gray-300">Loading your workouts...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait or refresh if this persists.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Video Dialog */}
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogContent className="bg-[#121212] border-[#2A2A2A] max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-[#FF6B00] font-['Montserrat'] uppercase">{currentVideoTitle}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full">
              {currentVideo && (
                <iframe
                  src={`https://www.youtube.com/embed/${currentVideo}`}
                  title={currentVideoTitle}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default Training;
