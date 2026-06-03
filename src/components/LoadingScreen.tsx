import { FC, useEffect, useState } from "react";

const logoUrl = "/logo.png";

interface LoadingScreenProps {
  onDone: () => void;
}

const LoadingScreen: FC<LoadingScreenProps> = ({ onDone }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1800);
    const doneTimer = setTimeout(() => onDone(), 2400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <img
        src={logoUrl}
        alt="Wild Card"
        className="w-40 h-40 object-contain"
        draggable={false}
      />
    </div>
  );
};

export default LoadingScreen;
