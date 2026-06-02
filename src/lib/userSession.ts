// User session management to ensure each user gets their own unique account
export interface UserSession {
  userId: string;
  sessionId: string;
  createdAt: string;
  lastActive: string;
}

class UserSessionManager {
  private readonly SESSION_KEY = 'wildcard_user_session';
  
  // Generate a unique user ID based on browser fingerprint + timestamp
  private generateUniqueUserId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    
    // Create a simple browser fingerprint
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|');
    
    // Hash the fingerprint (simple hash function)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `user_${Math.abs(hash)}_${timestamp}_${random}`;
  }
  
  // Get or create user session
  getUserSession(): UserSession {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const session: UserSession = JSON.parse(stored);
        
        // Update last active time
        session.lastActive = new Date().toISOString();
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        
        return session;
      }
    } catch (error) {
      console.warn('Failed to load user session, creating new one:', error);
    }
    
    // Create new session
    const newSession: UserSession = {
      userId: this.generateUniqueUserId(),
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(newSession));
    } catch (error) {
      console.error('Failed to save user session:', error);
    }
    
    return newSession;
  }
  
  // Get current user ID
  getCurrentUserId(): string {
    return this.getUserSession().userId;
  }
  
  // Get numeric user ID for API compatibility — prefers authenticated user ID
  getNumericUserId(): number {
    try {
      const stored = localStorage.getItem('wildcard_auth_v2');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && typeof user.userId === 'number') return user.userId;
      }
    } catch {}
    // Fall back to hashed session ID for guests
    const userId = this.getCurrentUserId();
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000000;
  }
  
  // Clear session (for logout/reset)
  clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  }
  
  // Check if user has an existing session
  hasExistingSession(): boolean {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      return !!stored;
    } catch {
      return false;
    }
  }
}

export const userSessionManager = new UserSessionManager();