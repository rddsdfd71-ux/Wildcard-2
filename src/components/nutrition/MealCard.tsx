import { FC } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MealCardProps } from "@/lib/types";

const MealCard: FC<MealCardProps> = ({
  title,
  description,
  icon,
  calories,
  protein,
  carbs,
  fats,
  type,
}) => {
  return (
    <Card className="bg-[#2A2A2A] rounded-lg overflow-hidden mb-4">
      <CardHeader className="bg-[#FF6B00] text-black px-4 py-2 font-['Montserrat'] font-bold text-sm uppercase">
        {title}
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-start mb-3">
          <div className="w-16 h-16 bg-[#121212] rounded flex items-center justify-center mr-3">
            <i className={`fas fa-${icon} text-[#FF6B00] text-2xl`}></i>
          </div>
          <div>
            <h4 className="font-medium mb-1">{type}</h4>
            <p className="text-sm opacity-70">{description}</p>
          </div>
        </div>
        <div className="flex justify-between text-xs">
          <span><i className="fas fa-fire text-[#FF6B00] mr-1"></i> {calories} calories</span>
          <span><i className="fas fa-drumstick-bite text-[#FF6B00] mr-1"></i> {protein}g protein</span>
          <span><i className="fas fa-bread-slice text-[#FF6B00] mr-1"></i> {carbs}g carbs</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MealCard;
