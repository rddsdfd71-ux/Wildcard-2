import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TechniqueCardProps } from "@/lib/types";

const TechniqueCard: FC<TechniqueCardProps> = ({
  id,
  name,
  description,
  icon,
  tag,
  category,
  hasVideo,
}) => {
  return (
    <Card className="bg-[#2A2A2A] rounded-lg overflow-hidden hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300">
      <div className="relative">
        <div className="h-32 bg-[#121212] flex items-center justify-center">
          <div className="w-full h-full bg-[#000000] bg-opacity-50 flex items-center justify-center">
            <i className={`fas fa-${icon} text-[#FF6B00] text-4xl`}></i>
          </div>
        </div>
        {tag && (
          <div className="absolute top-2 right-2 bg-[#FF6B00] text-black px-2 py-1 rounded text-xs font-bold">
            {tag}
          </div>
        )}
        {hasVideo && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center">
            <i className="fas fa-play mr-1"></i>
            VIDEO
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-['Montserrat'] font-bold uppercase">{name}</h3>
        <p className="text-xs opacity-70 mb-2">{description}</p>
        <Button 
          variant="outline"
          className="w-full bg-[#000000] hover:bg-opacity-80 text-[#FF6B00] py-1 rounded text-sm font-bold transition-colors"
          asChild
        >
          <Link href={`/techniques/${id}`}>Learn Technique</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TechniqueCard;
