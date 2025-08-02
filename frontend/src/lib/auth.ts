import { proxy, useSnapshot } from "valtio";

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  user_type: string;
  customer?: any;
  author?: any;
  internal?: any;
  taker?: any;
}

export interface AuthSession {
  token: string;
  expires_at: string;
  user_type: string;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
}

// Global auth state using Valtio
export const authState = proxy<AuthState>({
  user: null,
  session: null,
  loading: false,
  error: null,
});

// API base URL
const API_BASE = '/api/auth';

/**
 * Laravel-style authentication service
 */
export const auth = {
  /**
   * Login with username/password
   */
  async login(username: string, password: string, userType: string = 'customer') {
    try {
      authState.loading = true;
      authState.error = null;

      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          user_type: userType,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Store session
      authState.user = data.data.user;
      authState.session = data.data.session;
      
      // Store token in localStorage for persistence
      localStorage.setItem('auth_token', data.data.session.token);
      localStorage.setItem('auth_user_type', data.data.session.user_type);

      return data.data;
    } catch (error) {
      authState.error = (error as Error).message;
      throw error;
    } finally {
      authState.loading = false;
    }
  },

  /**
   * Logout current user
   */
  async logout() {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Clear state regardless of API response
      authState.user = null;
      authState.session = null;
      authState.error = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user_type');
    }
  },

  /**
   * Get current user session
   */
  async me() {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        // Invalid token, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user_type');
        return null;
      }

      authState.user = data.data.user;
      authState.session = data.data.session;

      return data.data;
    } catch (error) {
      console.warn('Session verification failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user_type');
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!authState.user && !!authState.session;
  },

  /**
   * Check if user has specific user type
   */
  hasUserType(userType: string): boolean {
    return authState.user?.user_type === userType;
  },

  /**
   * Check if user is admin (internal)
   */
  isAdmin(): boolean {
    return this.hasUserType('internal');
  },

  /**
   * Check if user is taker
   */
  isTaker(): boolean {
    return this.hasUserType('taker');
  },

  /**
   * Get current user
   */
  user(): User | null {
    return authState.user;
  },

  /**
   * Get auth token
   */
  token(): string | null {
    return authState.session?.token || localStorage.getItem('auth_token');
  },

  /**
   * Initialize auth state from localStorage
   */
  async init() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await this.me();
    }
  }
};

/**
 * React hook for auth state
 */
export function useAuth() {
  const snapshot = useSnapshot(authState);
  
  return {
    ...snapshot,
    login: auth.login,
    logout: auth.logout,
    isAuthenticated: auth.isAuthenticated,
    hasUserType: auth.hasUserType,
    isAdmin: auth.isAdmin,
    isTaker: auth.isTaker,
    user: auth.user,
    token: auth.token,
  };
}