import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHealthIntegration } from "@/hooks/useHealthIntegration";

interface HealthPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  onConnected?: () => void;
}

export function HealthPermissionsDialog({ 
  open, 
  onOpenChange, 
  userId, 
  onConnected 
}: HealthPermissionsDialogProps) {
  const [step, setStep] = useState<'intro' | 'permissions' | 'connecting' | 'success'>('intro');
  const { 
    initHealth, 
    requestPermissions, 
    isInitializing, 
    isRequestingPermissions,
    permissions,
    healthData
  } = useHealthIntegration(userId);

  const handleRequestPermissions = async () => {
    setStep('permissions');
    try {
      await requestPermissions();
      setStep('connecting');
      
      // Simulate permission request process
      setTimeout(async () => {
        await initHealth();
        setStep('success');
        setTimeout(() => {
          onConnected?.();
          onOpenChange(false);
          setStep('intro'); // Reset for next time
        }, 2000);
      }, 2000);
    } catch (error) {
      console.error('Failed to request permissions:', error);
      setStep('intro');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="text-6xl">📱</div>
              <h3 className="text-xl font-bold text-white">Connect Your Health Data</h3>
              <p className="text-gray-400 leading-relaxed">
                Connect Wild Card to your device's health data to automatically track:
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-gray-900 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">👟</span>
                  <span className="font-semibold text-orange-500">Steps</span>
                </div>
                <p className="text-sm text-gray-400">Daily step count and walking distance</p>
              </div>
              
              <div className="p-4 bg-gray-900 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔥</span>
                  <span className="font-semibold text-orange-500">Calories</span>
                </div>
                <p className="text-sm text-gray-400">Calories burned from activity</p>
              </div>
              
              <div className="p-4 bg-gray-900 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">❤️</span>
                  <span className="font-semibold text-orange-500">Heart Rate</span>
                </div>
                <p className="text-sm text-gray-400">Real-time heart rate monitoring</p>
              </div>
              
              <div className="p-4 bg-gray-900 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⏱️</span>
                  <span className="font-semibold text-orange-500">Activity</span>
                </div>
                <p className="text-sm text-gray-400">Active minutes and workout detection</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleRequestPermissions}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3"
                disabled={isRequestingPermissions}
              >
                {isRequestingPermissions ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Requesting Access...
                  </div>
                ) : (
                  'Connect Health Data'
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="w-full text-gray-400 hover:text-white"
              >
                Skip for Now
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              Wild Card respects your privacy. Health data stays on your device and is only used to enhance your training experience.
            </p>
          </div>
        );

      case 'permissions':
        return (
          <div className="space-y-6 text-center">
            <div className="animate-pulse">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-xl font-bold text-white mb-2">Requesting Permissions</h3>
              <p className="text-gray-400">
                Please allow Wild Card to access your health data when prompted by your device.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <span className="text-white">Steps & Activity</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <span className="text-white">Heart Rate</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <span className="text-white">Calories</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              </div>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="space-y-6 text-center">
            <div className="animate-bounce">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-white mb-2">Connecting Health Data</h3>
              <p className="text-gray-400">
                Setting up your health data integration...
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-gray-400">Syncing with health platforms...</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="animate-bounce">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-white mb-2">Health Data Connected!</h3>
              <p className="text-gray-400">
                Your health data is now synced with Wild Card. You'll see real-time stats in your dashboard.
              </p>
            </div>
            
            {healthData && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-semibold mb-2">Current Stats:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Steps:</span>
                    <span className="text-white ml-2">{healthData.steps.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Calories:</span>
                    <span className="text-white ml-2">{healthData.calories}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121212] border-[#2A2A2A] max-w-md">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-[#FF6B00] font-['Montserrat'] uppercase text-center">
            Health Integration
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}