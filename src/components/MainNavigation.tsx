import { FC } from "react";
import { Link } from "wouter";
import { useAppState } from "@/hooks/useAppState";
import { NAV_ITEMS } from "@/lib/constants";
import { TabType } from "@/lib/types";

interface MainNavigationProps {
  currentPath: string;
}

const MainNavigation: FC<MainNavigationProps> = ({ currentPath }) => {
  const { setCurrentTab } = useAppState();
  
  // Convert path to tab type
  const getTabFromPath = (path: string): TabType => {
    if (path === "/") return "dashboard";
    return path.substring(1) as TabType; // Remove the leading slash
  };
  
  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId as TabType);
  };
  
  const currentTab = getTabFromPath(currentPath);
  
  return (
    <div className="bg-[#000000] text-[#E0E0E0] py-2 border-b border-[#FF6B00]">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto no-scrollbar" id="main-tabs">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.id === "dashboard" ? "/" : `/${item.id}`}
              onClick={() => handleTabClick(item.id)}
              className={`flex-shrink-0 px-4 py-2 font-['Montserrat'] text-sm font-bold uppercase ${
                currentTab === item.id
                  ? "border-b-3 border-[#FF6B00] text-[#FF6B00]"
                  : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainNavigation;
