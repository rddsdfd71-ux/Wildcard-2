import { FC } from "react";
import { Link } from "wouter";
import { useAppState } from "@/hooks/useAppState";
import { NAV_ITEMS } from "@/lib/constants";
import { TabType } from "@/lib/types";

interface BottomNavigationProps {
  currentPath: string;
}

const BottomNavigation: FC<BottomNavigationProps> = ({ currentPath }) => {
  const { setCurrentTab } = useAppState();
  
  // Convert path to tab type
  const getTabFromPath = (path: string): TabType => {
    if (path === "/") return "dashboard";
    return path.substring(1) as TabType; // Remove the leading slash
  };
  
  const currentTab = getTabFromPath(currentPath);
  
  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId as TabType);
  };
  
  return (
    <nav className="bg-[#000000] border-t border-[#2A2A2A] fixed bottom-0 w-full z-50">
      <div className="flex justify-around py-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.id === "dashboard" ? "/" : `/${item.id}`}
            onClick={() => handleTabClick(item.id)}
            className={`flex flex-col items-center ${
              currentTab === item.id
                ? "text-[#FF6B00]"
                : "text-[#E0E0E0] opacity-70"
            }`}
          >
            <i className={`fas fa-${item.icon} text-xl`}></i>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
