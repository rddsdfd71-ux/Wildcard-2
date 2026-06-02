import { FC } from "react";
import { ActivityItemProps } from "@/lib/types";

const ActivityItem: FC<ActivityItemProps> = ({
  day,
  activity,
  duration,
  completed,
  isToday,
  isRest,
}) => {
  return (
    <div className={`flex items-center bg-[#2A2A2A] p-3 rounded ${isToday ? 'opacity-70' : ''} ${isRest ? 'opacity-50' : ''}`}>
      <div className={`w-10 h-10 ${completed ? 'bg-[#FF6B00]' : isRest ? 'bg-[#121212]' : 'bg-[#FF6B00] bg-opacity-50'} rounded-full flex items-center justify-center mr-3`}>
        <span className="font-['Oswald'] font-bold">{day}</span>
      </div>
      <div className="flex-grow">
        <div className="font-medium">{activity}</div>
        <div className="text-sm opacity-70">{duration} {completed ? '• Completed' : isToday ? '• Today' : ''}</div>
      </div>
      <div className={completed ? 'text-[#FF6B00]' : ''}>
        {completed ? (
          <i className="fas fa-check-circle"></i>
        ) : isRest ? (
          <i className="fas fa-bed"></i>
        ) : (
          <i className="fas fa-circle"></i>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;
