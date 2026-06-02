import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control
        setShowUpdate(true);
      });

      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (worker) {
            setNewWorker(worker);
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 bg-[#1A1A1A] border-[#FF6B00] border-2 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <RefreshCw className="h-6 w-6 text-[#FF6B00]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm mb-1">
              App Update Available
            </h3>
            <p className="text-gray-300 text-xs mb-3">
              A new version of Wild Card is ready. Reload to get the latest features and improvements.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-[#FF6B00] hover:bg-[#FF8533] text-black font-bold"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Update Now
              </Button>
              
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Later
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