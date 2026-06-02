import { FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { TECHNIQUE_CATEGORIES, TECHNIQUE_VIDEOS } from "@/lib/constants";
import TechniqueCard from "@/components/techniques/TechniqueCard";
import VideoTutorial from "@/components/techniques/VideoTutorial";

const Techniques: FC = () => {
  const { id } = useParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Fetch techniques
  const { data: techniques, isLoading } = useQuery({
    queryKey: ["/api/techniques"],
  });
  
  // Filter techniques by category
  const filteredTechniques = Array.isArray(techniques) ? techniques.filter((technique: any) => 
    selectedCategory === "all" || 
    technique.category === selectedCategory ||
    (selectedCategory === "opposite-foot" && technique.focus === "left")
  ) : [];
  
  // Get featured technique (knuckleball)
  const featuredTechnique = Array.isArray(techniques) ? techniques.find((t: any) => t.name === "Knuckleball") : null;
  
  // Handle individual technique view
  if (id) {
    const technique = Array.isArray(techniques) ? techniques.find((t: any) => t.id === parseInt(id)) : null;
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto mb-2"></div>
            <p className="text-[#E0E0E0]">Loading technique...</p>
          </div>
        </div>
      );
    }
    
    if (!technique) {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-[#FF6B00] mb-4">Technique Not Found</h2>
          <p className="text-[#E0E0E0] mb-4">The requested technique could not be found.</p>
          <Link href="/techniques">
            <Button className="bg-[#FF6B00] hover:bg-[#FF6B00]/80 text-black font-bold">
              Back to Techniques
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <section className="tab-content animate-in slide-in-from-left duration-300">
        <div className="mb-6">
          <Link href="/techniques">
            <Button variant="ghost" className="text-[#FF6B00] hover:text-[#FF6B00]/80 mb-4">
              ← Back to Techniques
            </Button>
          </Link>
          <h2 className="font-['Montserrat'] text-2xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">
            {technique.name}
          </h2>
          <p className="text-[#E0E0E0] mb-6">{technique.description}</p>
        </div>

        <div className="grid gap-6">
          {/* Main Technique Overview */}
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#FF6B00] text-black text-sm font-bold rounded-full">
                    {technique.category}
                  </span>
                  <span className="px-3 py-1 bg-[#2A2A2A] text-[#E0E0E0] text-sm rounded-full">
                    {technique.difficulty}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#FF6B00] font-bold">DIFFICULTY</div>
                  <div className="flex gap-1">
                    {Array.from({length: 3}).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < (technique.difficulty === 'beginner' ? 1 : technique.difficulty === 'intermediate' ? 2 : 3)
                            ? 'bg-[#FF6B00]'
                            : 'bg-[#2A2A2A]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-[#FF6B00] mb-3">{technique.name}</h3>
              <p className="text-[#E0E0E0] text-lg mb-6">{technique.description}</p>
              
              {/* Visual Diagram Placeholder */}
              <div className="bg-[#000000] rounded-lg p-8 mb-6 text-center">
                <div className="inline-block bg-[#2A2A2A] rounded-lg p-6">
                  <i className="fas fa-futbol text-[#FF6B00] text-6xl mb-4"></i>
                  <h4 className="text-[#FF6B00] font-bold mb-2">Technique Diagram</h4>
                  <p className="text-[#E0E0E0] text-sm">Visual representation of {technique.name} technique</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-Step Instructions */}
          {technique.steps && technique.steps.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardContent className="p-6">
                <h4 className="font-bold text-[#FF6B00] text-xl mb-4 flex items-center">
                  <i className="fas fa-list-ol mr-3"></i>
                  Step-by-Step Instructions
                </h4>
                <div className="space-y-4">
                  {technique.steps.map((step: string, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-[#000000] rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#FF6B00] text-black font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <p className="text-[#E0E0E0] leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pro Tips */}
          {technique.tips && technique.tips.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardContent className="p-6">
                <h4 className="font-bold text-[#FF6B00] text-xl mb-4 flex items-center">
                  <i className="fas fa-lightbulb mr-3"></i>
                  Pro Tips
                </h4>
                <div className="grid gap-3">
                  {technique.tips.map((tip: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-[#000000] rounded-lg">
                      <i className="fas fa-star text-[#FF6B00] mt-1 flex-shrink-0"></i>
                      <p className="text-[#E0E0E0]">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Common Mistakes */}
          {technique.commonMistakes && technique.commonMistakes.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardContent className="p-6">
                <h4 className="font-bold text-[#FF6B00] text-xl mb-4 flex items-center">
                  <i className="fas fa-exclamation-triangle mr-3"></i>
                  Common Mistakes to Avoid
                </h4>
                <div className="grid gap-3">
                  {technique.commonMistakes.map((mistake: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-[#000000] rounded-lg border-l-4 border-red-500">
                      <i className="fas fa-times-circle text-red-500 mt-1 flex-shrink-0"></i>
                      <p className="text-[#E0E0E0]">{mistake}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Practice Exercises */}
          {technique.practiceExercises && technique.practiceExercises.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardContent className="p-6">
                <h4 className="font-bold text-[#FF6B00] text-xl mb-4 flex items-center">
                  <i className="fas fa-dumbbell mr-3"></i>
                  Practice Exercises
                </h4>
                <div className="grid gap-3">
                  {technique.practiceExercises.map((exercise: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-[#000000] rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-[#FF6B00] text-black font-bold rounded text-sm flex items-center justify-center">
                        {index + 1}
                      </div>
                      <p className="text-[#E0E0E0]">{exercise}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Tutorial */}
          {technique.videoUrl && (
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardContent className="p-6">
                <h4 className="font-bold text-[#FF6B00] text-xl mb-4 flex items-center">
                  <i className="fas fa-play mr-3"></i>
                  Video Tutorial
                </h4>
                <div className="bg-[#000000] rounded-lg overflow-hidden">
                  <iframe
                    src={(() => {
                      const url = technique.videoUrl;
                      if (!url) return '';
                      
                      // Extract video ID from different YouTube URL formats
                      let videoId = '';
                      if (url.includes('youtube.com/watch?v=')) {
                        videoId = url.split('watch?v=')[1].split('&')[0];
                      } else if (url.includes('youtu.be/')) {
                        videoId = url.split('youtu.be/')[1].split('?')[0];
                      } else if (url.includes('youtube.com/embed/')) {
                        return url; // Already embed format
                      }
                      
                      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
                    })()}
                    title={`${technique.name} Tutorial`}
                    className="w-full h-64 md:h-80"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onError={() => console.error(`Failed to load video for ${technique.name}: ${technique.videoUrl}`)}
                  />
                </div>
                <div className="mt-2 text-xs text-[#888] flex items-center">
                  <i className="fas fa-external-link-alt mr-2"></i>
                  <a href={technique.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF6B00] hover:underline">
                    Open video in YouTube
                  </a>
                </div>
                <p className="text-[#E0E0E0] mt-3 text-sm">
                  Watch this tutorial to master the {technique.name} technique step by step.
                </p>
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
        <h2 className="font-['Montserrat'] text-xl font-bold uppercase mb-3 border-l-4 border-[#FF6B00] pl-3">Football Techniques</h2>
        
        {/* Technique Categories */}
        <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
          {TECHNIQUE_CATEGORIES.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              className={`whitespace-nowrap ${
                selectedCategory === category.value 
                  ? "bg-[#FF6B00] text-black" 
                  : "bg-[#2A2A2A]"
              } px-4 py-2 rounded-full text-sm`}
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </Button>
          ))}
        </div>
        
        {/* Featured Technique */}
        {featuredTechnique && (
          <VideoTutorial
            videoId={TECHNIQUE_VIDEOS.KNUCKLEBALL}
            title="Master the Knuckleball"
            description="Learn the technique that makes the ball move unpredictably in the air."
            difficulty="Advanced"
            duration="10 min tutorial"
          />
        )}
        
        {/* Technique Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <i className="fas fa-spinner fa-spin text-[#FF6B00] text-3xl mb-2"></i>
              <p>Loading techniques...</p>
            </div>
          ) : filteredTechniques?.length > 0 ? (
            filteredTechniques.map((technique: any) => (
              <TechniqueCard
                key={technique.id}
                id={technique.id}
                name={technique.name}
                description={technique.description}
                icon={technique.category === "shooting" ? "bezier-curve" : 
                      technique.focus === "left" ? "shoe-prints" : 
                      technique.name.includes("Power") ? "bolt" : "shield-alt"}
                tag={technique.isPopular ? "POPULAR" : technique.focus === "left" ? "RECOMMENDED" : undefined}
                category={technique.category}
                hasVideo={!!technique.videoUrl}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p>No techniques found for this category.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Techniques;