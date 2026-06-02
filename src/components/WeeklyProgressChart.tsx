import { FC } from "react";
import { DayBreakdown } from "@/hooks/useWeeklyProgress";

interface WeeklyProgressChartProps {
  currentProgress: number;
  weeklyGoal: number;
  completed: number;
  dailyBreakdown?: DayBreakdown[];
}

const WeeklyProgressChart: FC<WeeklyProgressChartProps> = ({ 
  currentProgress, 
  weeklyGoal, 
  completed,
  dailyBreakdown = []
}) => {
  // Use real daily breakdown data if available, otherwise show empty bars
  
  const maxHeight = 60; // Maximum bar height in pixels
  const today = new Date().getDay();
  
  return (
    <div className="bg-[#000000] rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-['Oswald'] text-sm text-[#FF6B00]">Weekly Activity</h4>
        <span className="text-xs opacity-70">{completed}/{weeklyGoal} sessions</span>
      </div>
      
      <div className="flex items-end justify-between h-16 gap-1">
        {dailyBreakdown.map((day, index) => {
          const today = new Date().getDay();
          const barHeight = Math.max((day.sessions / (weeklyGoal / 7)) * maxHeight, 2);
          const isToday = index === today;
          const isPastDay = index < today;
          const isFutureDay = index > today;
          
          return (
            <div key={day.dayShort} className="flex flex-col items-center flex-1">
              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-700 ease-in-out ${
                  day.sessions > 0
                    ? 'bg-gradient-to-t from-[#FF6B00] to-[#FF9E2C]'
                    : isFutureDay
                    ? 'bg-[#2A2A2A]'
                    : 'bg-[#444444]'
                } ${isToday ? 'ring-2 ring-[#FF6B00] ring-opacity-50' : ''}`}
                style={{ 
                  height: `${barHeight}px`,
                  minHeight: '2px'
                }}
              >
                {/* Session count indicator */}
                {day.sessions > 0 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-bold text-black">
                      {day.sessions}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Day label */}
              <span className={`text-xs mt-1 ${
                isToday 
                  ? 'text-[#FF6B00] font-bold' 
                  : day.sessions > 0 
                  ? 'text-white' 
                  : 'text-gray-500'
              }`}>
                {day.dayShort}
              </span>
              
              {/* Today indicator */}
              {isToday && (
                <div className="w-1 h-1 bg-[#FF6B00] rounded-full mt-1"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress summary */}
      <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
        <div className="flex justify-between text-xs">
          <span className="opacity-70">This week</span>
          <span className="text-[#FF6B00] font-bold">{currentProgress}% complete</span>
        </div>
        <div className="w-full bg-[#2A2A2A] h-1 rounded-full mt-2">
          <div 
            className="bg-gradient-to-r from-[#FF6B00] to-[#FF9E2C] h-1 rounded-full transition-all duration-1000"
            style={{ width: `${currentProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgressChart;