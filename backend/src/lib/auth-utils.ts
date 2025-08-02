/**
 * Laravel-style authentication utilities
 */

export interface AuthenticatedUser {
  id: string | number;
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
  user: AuthenticatedUser;
}

/**
 * Get session from Authorization header
 */
export async function getSession(headers: Headers): Promise<AuthSession | null> {
  try {
    const authHeader = headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return null;
    }

    // Find session with this token
    const sessions = await db.sessions.findMany();
    let foundSession = null;
    let sessionPayload: any = null;
    
    for (const session of sessions) {
      try {
        const payload = JSON.parse(session.payload);
        if (payload.token === sessionToken) {
          // Check if session is expired
          if (new Date(payload.expires_at) < new Date()) {
            await db.sessions.delete({ where: { id: session.id } });
            return null;
          }
          
          foundSession = session;
          sessionPayload = payload;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!foundSession || !sessionPayload) {
      return null;
    }

    // Update last activity
    await db.sessions.update({
      where: { id: foundSession.id },
      data: { last_activity: Math.floor(Date.now() / 1000) }
    });

    // Get user data based on user type
    let userData: AuthenticatedUser | null = null;
    
    if (sessionPayload.user_type === "taker") {
      const taker = await db.takers.findUnique({
        where: { id: parseInt(sessionPayload.user_id) }
      });
      
      if (taker) {
        userData = {
          id: taker.id,
          email: taker.email || '',
          username: taker.reg || taker.email || undefined,
          name: taker.name,
          user_type: "taker",
          taker: taker
        };
      }
    } else if (sessionPayload.user_type === "internal") {
      const user = await db.users.findUnique({
        where: { id: parseInt(sessionPayload.user_id) }
      });
      
      if (user) {
        const { password, ...userWithoutPassword } = user;
        userData = {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          user_type: "internal",
          internal: userWithoutPassword
        };
      }
    }

    if (!userData) {
      return null;
    }

    return {
      token: sessionToken,
      expires_at: sessionPayload.expires_at,
      user_type: sessionPayload.user_type,
      user: userData
    };

  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

/**
 * Middleware function to require authentication
 */
export function requireAuth(allowedUserTypes?: string[]) {
  return async (headers: Headers) => {
    const session = await getSession(headers);
    
    if (!session) {
      throw new Error("Authentication required");
    }

    if (allowedUserTypes && !allowedUserTypes.includes(session.user_type)) {
      throw new Error("Insufficient permissions");
    }

    return session;
  };
}

/**
 * Check if user has permission to access resource
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  // Simple role-based permissions
  const permissions: Record<string, string[]> = {
    customer: ['profile.read', 'profile.update'],
    taker: ['exam.take', 'results.view'],
    author: ['content.create', 'content.update', 'content.delete'],
    internal: ['admin.read', 'admin.write', 'users.manage'],
  };

  const userPermissions = permissions[user.user_type] || [];
  return userPermissions.includes(permission) || user.user_type === 'internal'; // Internal users have all permissions
}