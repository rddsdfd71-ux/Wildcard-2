import { Switch, Route, useLocation } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStateProvider } from "@/hooks/useAppState";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Training from "@/pages/Training";
import Techniques from "@/pages/Techniques";
import Stats from "@/pages/Stats";
import Valuation from "@/pages/Valuation";
import PositionAnalysis from "@/pages/PositionAnalysis";
import Settings from "@/pages/Settings";
import Nutrition from "@/pages/Nutrition";
import Subscription from "@/pages/Subscription";
import Header from "@/components/Header";
import MainNavigation from "@/components/MainNavigation";
import BottomNavigation from "@/components/BottomNavigation";
import LoadingScreen from "@/components/LoadingScreen";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { isAuthenticated } from "@/lib/auth";

function Router() {
  const [location] = useLocation();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <MainNavigation currentPath={location} />
      <main className="flex-1 pb-20 md:pb-0">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/training" component={Training} />
          <Route path="/techniques" component={Techniques} />
          <Route path="/stats" component={Stats} />
          <Route path="/valuation" component={Valuation} />
          <Route path="/position" component={PositionAnalysis} />
          <Route path="/nutrition" component={Nutrition} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/settings" component={Settings} />
        </Switch>
      </main>
      <BottomNavigation currentPath={location} />
      <PWAInstallPrompt />
      <OfflineIndicator />
      <UpdatePrompt />
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppStateProvider>
          <Toaster />
          {loading && <LoadingScreen onDone={() => setLoading(false)} />}
          {!loading && <Router />}
        </AppStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
