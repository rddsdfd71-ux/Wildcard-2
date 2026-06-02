import { FC } from "react";
import { StatsBarProps } from "@/lib/types";

const ProgressBar: FC<StatsBarProps> = ({ label, level, maxLevel = 10 }) => {
  const progress = (level / maxLevel) * 100;
  
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-bold">Level {level}</span>
      </div>
      <div className="w-full bg-[#2A2A2A] h-2 rounded-full">
        <div 
          className="bg-[#FF6B00] h-2 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs mt-1 opacity-70">
        <span>Week 1</span>
        <span>Current</span>
        <span>Goal</span>
      </div>
    </div>
  );
};

export default ProgressBar;
