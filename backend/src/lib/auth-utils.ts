/**
 * Laravel-style authentication utilities
 */

export interface AuthenticatedUser {
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
  expires_at: Date;
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

    // Find and validate session
    const session = await db.auth_session.findFirst({
      where: {
        id: sessionToken,
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        auth_user: {
          include: {
            customer: true,
            author: true,
            internal: true
          }
        },
        taker: {
          include: {
            groups: true
          }
        }
      }
    });

    if (!session) {
      return null;
    }

    // Prepare user data based on user type
    let userData: AuthenticatedUser;

    if (session.user_type === "taker") {
      userData = {
        id: `taker_${session.taker?.id}`,
        email: session.taker?.email || '',
        username: session.taker?.username,
        name: session.taker?.name,
        user_type: "taker",
        taker: session.taker
      };
    } else if (session.auth_user) {
      const { password, ...userWithoutPassword } = session.auth_user;
      userData = {
        ...userWithoutPassword,
        user_type: session.user_type
      } as AuthenticatedUser;
    } else {
      return null;
    }

    return {
      token: sessionToken,
      expires_at: session.expires_at,
      user_type: session.user_type,
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