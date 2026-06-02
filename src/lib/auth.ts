const AUTH_KEY = 'wildcard_auth_v2';

export interface AuthUser {
  userId: number;
  username: string;
  fullName?: string | null;
  isPremium?: boolean;
}

export function getAuthUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save auth user', e);
  }
}

export function clearAuthUser(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {}
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}
