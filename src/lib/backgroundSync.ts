import { offlineStorage } from './offlineStorage';

class BackgroundSync {
  private syncInProgress = false;

  async scheduleSync(type: string, data: any) {
    // Add to offline storage queue
    await offlineStorage.addToSyncQueue(type, data);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.performSync();
    } else {
      // Register for background sync when back online
      this.registerBackgroundSync(type);
    }
  }

  private async registerBackgroundSync(tag: string) {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Try to use background sync if available
        if ('sync' in registration) {
          await (registration as any).sync.register(tag);
          console.log(`Background sync registered for ${tag}`);
        } else {
          this.startPeriodicSync();
        }
      } catch (error) {
        console.log('Background sync registration failed:', error);
        // Fallback to periodic checks
        this.startPeriodicSync();
      }
    } else {
      // Fallback for browsers without background sync
      this.startPeriodicSync();
    }
  }

  private startPeriodicSync() {
    // Check for sync every 30 seconds when online
    const interval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.performSync();
      }
    }, 30000);

    // Clear interval when app is hidden/closed
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(interval);
      }
    });
  }

  private async performSync() {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;
    
    try {
      const queue = await offlineStorage.getSyncQueue();
      
      for (const item of queue) {
        try {
          await this.syncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
        } catch (error) {
          console.log('Failed to sync item:', item.id, error);
        }
      }
    } catch (error) {
      console.log('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: any) {
    const { type, data } = item;

    switch (type) {
      case 'workout':
        await this.syncWorkout(data);
        break;
      case 'health-data':
        await this.syncHealthData(data);
        break;
      case 'progress':
        await this.syncProgress(data);
        break;
      default:
        console.log('Unknown sync type:', type);
    }
  }

  private async syncWorkout(workoutData: any) {
    const response = await fetch('/api/workout-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workoutData)
    });

    if (!response.ok) {
      throw new Error(`Workout sync failed: ${response.status}`);
    }

    return response.json();
  }

  private async syncHealthData(healthData: any) {
    const response = await fetch(`/api/users/${healthData.userId}/health-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(healthData)
    });

    if (!response.ok) {
      throw new Error(`Health data sync failed: ${response.status}`);
    }

    return response.json();
  }

  private async syncProgress(progressData: any) {
    const response = await fetch(`/api/users/${progressData.userId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData)
    });

    if (!response.ok) {
      throw new Error(`Progress sync failed: ${response.status}`);
    }

    return response.json();
  }

  // Manual sync trigger
  async syncNow() {
    if (navigator.onLine) {
      await this.performSync();
    }
  }

  // Check sync status
  async getPendingCount(): Promise<number> {
    const queue = await offlineStorage.getSyncQueue();
    return queue.length;
  }
}

export const backgroundSync = new BackgroundSync();