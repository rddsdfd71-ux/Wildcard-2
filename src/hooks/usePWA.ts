import { useState, useEffect } from 'react';

interface PWAHook {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  installPrompt: () => void;
  updateAvailable: boolean;
  reloadApp: () => void;
}

export function usePWA(): PWAHook {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // App installed
    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Service worker update
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
    };

    checkInstalled();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate);
      }
    };
  }, []);

  const installPrompt = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setCanInstall(false);
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const reloadApp = () => {
    window.location.reload();
  };

  return {
    isOnline,
    isInstalled,
    canInstall,
    installPrompt,
    updateAvailable,
    reloadApp
  };
}