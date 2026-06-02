import { FC } from "react";
import { WorkoutItemProps } from "@/lib/types";

const WorkoutItem: FC<WorkoutItemProps> = ({
  id,
  name,
  sets,
  reps,
  order,
  onPlay,
}) => {
  return (
    <div className="flex items-center bg-[#2A2A2A] p-3 rounded">
      <div className="w-10 h-10 bg-[#FF6B00] bg-opacity-20 rounded-full flex items-center justify-center mr-3">
        <span className="font-['Oswald'] font-bold">{order}</span>
      </div>
      <div className="flex-grow">
        <div className="font-medium">{name}</div>
        <div className="text-sm opacity-70">{sets} sets × {reps} reps</div>
      </div>
      <button className="text-[#FF6B00]" onClick={onPlay}>
        <i className="fas fa-play-circle text-xl"></i>
      </button>
    </div>
  );
};

export default WorkoutItem;
