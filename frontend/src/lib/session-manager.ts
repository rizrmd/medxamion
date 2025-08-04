import { authState } from "./auth";

export class SessionManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private isAuthenticated = false;
  private sessionToken: string | null = null;

  constructor() {
    // Automatically connect when authenticated
    this.init();
  }

  async init() {
    // Check if user is authenticated
    if (authState.session?.token) {
      this.sessionToken = authState.session.token;
      this.connect();
    } else {
      // Try to get token from localStorage
      this.sessionToken = await this.getSessionToken();
      if (this.sessionToken) {
        this.connect();
      }
    }
  }

  private async getSessionToken(): Promise<string | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      // Verify token is still valid
      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          return data.data.token;
        }
      }
    } catch (error) {
      console.error('Failed to get session token:', error);
    }
    return null;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/session`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.authenticate();
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.stopPing();
        
        // Only reconnect if we're still authenticated
        if (this.isAuthenticated && this.sessionToken) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private authenticate() {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionToken) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: this.sessionToken
      }));
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'auth_success':
        this.isAuthenticated = true;
        console.log('WebSocket authenticated');
        break;

      case 'force_logout':
        this.handleForceLogout(data.message);
        break;

      case 'session_expired':
        this.handleSessionExpired(data.message);
        break;

      case 'error':
        console.error('WebSocket error:', data.message);
        if (data.message === 'Invalid session') {
          this.handleSessionExpired('Sesi Anda telah berakhir');
        }
        break;

      case 'pong':
        // Ping response received
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private async handleForceLogout(message: string) {
    console.log('Force logout:', message);
    
    // Clear authentication state
    this.isAuthenticated = false;
    this.sessionToken = null;
    
    // Close WebSocket
    this.disconnect();
    
    // Clear auth state
    authState.user = null;
    authState.session = null;
    
    // Show notification to user
    alert(message || 'Sesi Anda telah berakhir karena login di perangkat lain');
    
    // Redirect to login page
    window.location.href = '/login';
  }

  private handleSessionExpired(message: string) {
    this.handleForceLogout(message || 'Sesi Anda telah berakhir');
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = window.setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }, 5000); // Retry after 5 seconds
  }

  disconnect() {
    this.isAuthenticated = false;
    this.stopPing();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Update session token when user logs in
  updateSessionToken(token: string) {
    this.sessionToken = token;
    this.disconnect();
    this.connect();
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();