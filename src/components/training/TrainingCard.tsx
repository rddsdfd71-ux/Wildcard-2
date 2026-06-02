import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TrainingCardProps } from "@/lib/types";

const TrainingCard: FC<TrainingCardProps> = ({
  id,
  name,
  description,
  workoutsPerWeek,
  focusArea,
  icon,
}) => {
  return (
    <Card className="bg-[#2A2A2A] rounded-lg overflow-hidden hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300">
      <div className="h-32 bg-[#FF6B00] bg-opacity-20 flex items-center justify-center">
        <i className={`fas fa-${icon} text-[#FF6B00] text-5xl`}></i>
      </div>
      <CardContent className="p-4">
        <h3 className="font-['Montserrat'] text-lg font-bold uppercase mb-1">{name}</h3>
        <p className="text-sm opacity-70 mb-3">{description}</p>
        <div className="flex justify-between text-sm">
          <span>{focusArea}</span>
          <span className="text-[#FF6B00]">{workoutsPerWeek} workouts/week</span>
        </div>
        <Button 
          className="mt-3 w-full bg-[#FF6B00] hover:bg-[#FF9E2C] text-black py-2 rounded font-bold transition-colors"
          asChild
        >
          <Link href={`/training/${id}`}>View Program</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrainingCard;
