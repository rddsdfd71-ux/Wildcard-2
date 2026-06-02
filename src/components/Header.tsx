import { FC } from "react";
import kunigamiImage from "@/assets/kunigami.jpeg";

const Header: FC = () => {
  return (
    <header className="bg-[#000000] relative">
      <div className="relative">
        {/* Kunigami Image */}
        <div className="w-full h-48 bg-[#2A2A2A] flex items-center justify-center overflow-hidden">
          <img 
            src={kunigamiImage} 
            alt="Kunigami from Blue Lock" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#000000] bg-opacity-60">
            {/* Overlay content */}
          </div>
        </div>
        
        {/* App Title */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#000000] to-transparent p-4">
          <div className="font-['Montserrat'] text-2xl font-bold uppercase text-[#FF6B00] tracking-wider">Wild Card</div>
          <div className="text-sm text-[#E0E0E0] opacity-70">Your Personal Football Coach</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
