import { FC, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VideoTutorialProps } from "@/lib/types";

const VideoTutorial: FC<VideoTutorialProps> = ({
  videoId,
  title,
  description,
  difficulty,
  duration,
}) => {
  const [loading, setLoading] = useState(true);

  return (
    <Card className="bg-[#000000] rounded-lg overflow-hidden mb-6">
      <div className="h-48 bg-[#2A2A2A] flex items-center justify-center relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-[#FF6B00] text-3xl mb-2"></i>
              <div className="text-sm opacity-70">Loading video...</div>
            </div>
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoading(false)}
        ></iframe>
      </div>
      <CardContent className="p-4">
        <h3 className="font-['Montserrat'] text-lg font-bold uppercase mb-1 text-[#FF6B00]">{title}</h3>
        <p className="text-sm opacity-70 mb-3">{description}</p>
        <div className="flex justify-between text-sm">
          <span><i className="fas fa-star text-[#FF6B00] mr-1"></i> {difficulty}</span>
          <span><i className="fas fa-clock text-[#FF6B00] mr-1"></i> {duration}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoTutorial;
