import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if app is already running in standalone mode
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
    setIsStandalone(isInStandalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay if user hasn't dismissed it before
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-dismissed');
      if (!hasSeenPrompt && !isInStandalone) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // Listen for app install
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem('pwa-install-prompt-dismissed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA install accepted');
      } else {
        console.log('PWA install dismissed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-dismissed', 'true');
  };

  // Don't show if already installed or user has dismissed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-[#1A1A1A] border-[#FF6B00] border-2 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6 text-[#FF6B00]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm mb-1">
              Install Wild Card App
            </h3>
            <p className="text-gray-300 text-xs mb-3">
              {isIOS 
                ? "Tap the share button and 'Add to Home Screen' for the best experience"
                : "Get faster access and offline features by installing our app"
              }
            </p>
            
            <div className="flex gap-2">
              {!isIOS && deferredPrompt && (
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-[#FF6B00] hover:bg-[#FF8533] text-black font-bold"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Install
                </Button>
              )}
              
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Not Now
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}