// IndexedDB wrapper for offline data storage
class OfflineStorage {
  private dbName = 'WildCardDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
          workoutStore.createIndex('userId', 'userId', { unique: false });
          workoutStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('healthData')) {
          const healthStore = db.createObjectStore('healthData', { keyPath: 'id' });
          healthStore.createIndex('userId', 'userId', { unique: false });
          healthStore.createIndex('recordDate', 'recordDate', { unique: false });
        }

        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
          progressStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Workout data methods
  async saveWorkout(workout: any): Promise<void> {
    const store = this.getStore('workouts', 'readwrite');
    await this.promisifyRequest(store.put({
      ...workout,
      id: workout.id || `workout_${Date.now()}`,
      timestamp: Date.now(),
      synced: false
    }));
  }

  async getWorkouts(userId: number): Promise<any[]> {
    const store = this.getStore('workouts');
    const index = store.index('userId');
    return this.promisifyRequest(index.getAll(userId));
  }

  async getUnsyncedWorkouts(): Promise<any[]> {
    const store = this.getStore('workouts');
    const request = store.getAll();
    const all = await this.promisifyRequest(request);
    return all.filter(workout => !workout.synced);
  }

  async markWorkoutSynced(id: string): Promise<void> {
    const store = this.getStore('workouts', 'readwrite');
    const workout = await this.promisifyRequest(store.get(id));
    if (workout) {
      workout.synced = true;
      await this.promisifyRequest(store.put(workout));
    }
  }

  // Health data methods
  async saveHealthData(healthData: any): Promise<void> {
    const store = this.getStore('healthData', 'readwrite');
    await this.promisifyRequest(store.put({
      ...healthData,
      id: healthData.id || `health_${Date.now()}`,
      timestamp: Date.now(),
      synced: false
    }));
  }

  async getHealthData(userId: number, recordDate: string): Promise<any> {
    const store = this.getStore('healthData');
    const index = store.index('userId');
    const all = await this.promisifyRequest(index.getAll(userId));
    return all.find(data => data.recordDate === recordDate);
  }

  async getUnsyncedHealthData(): Promise<any[]> {
    const store = this.getStore('healthData');
    const request = store.getAll();
    const all = await this.promisifyRequest(request);
    return all.filter(data => !data.synced);
  }

  async markHealthDataSynced(id: string): Promise<void> {
    const store = this.getStore('healthData', 'readwrite');
    const data = await this.promisifyRequest(store.get(id));
    if (data) {
      data.synced = true;
      await this.promisifyRequest(store.put(data));
    }
  }

  // Progress tracking methods
  async saveProgress(progress: any): Promise<void> {
    const store = this.getStore('progress', 'readwrite');
    await this.promisifyRequest(store.put({
      ...progress,
      id: `progress_${progress.userId}`,
      timestamp: Date.now()
    }));
  }

  async getProgress(userId: number): Promise<any> {
    const store = this.getStore('progress');
    return this.promisifyRequest(store.get(`progress_${userId}`));
  }

  // Background sync queue
  async addToSyncQueue(type: string, data: any): Promise<void> {
    const store = this.getStore('pendingSync', 'readwrite');
    await this.promisifyRequest(store.put({
      id: `${type}_${Date.now()}`,
      type,
      data,
      timestamp: Date.now()
    }));
  }

  async getSyncQueue(): Promise<any[]> {
    const store = this.getStore('pendingSync');
    return this.promisifyRequest(store.getAll());
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const store = this.getStore('pendingSync', 'readwrite');
    await this.promisifyRequest(store.delete(id));
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

// Initialize on import
offlineStorage.init().catch(console.error);