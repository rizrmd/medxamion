import type { ServerWebSocket } from "bun";

interface SessionData {
  userId?: string;
  sessionToken?: string;
  userType?: string;
}

type SessionWebSocket = ServerWebSocket<SessionData>;

// Map to track active WebSocket connections by user ID
const userConnections = new Map<string, SessionWebSocket>();

// Map to track session tokens to WebSocket connections
const sessionConnections = new Map<string, SessionWebSocket>();

export const sessionWebSocketHandler: any = {
  open(ws: SessionWebSocket) {
    console.log("WebSocket connection opened");
  },

  async message(ws: SessionWebSocket, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case "auth":
          // Authenticate the WebSocket connection
          const sessionToken = data.token;
          if (!sessionToken) {
            ws.send(JSON.stringify({ type: "error", message: "No token provided" }));
            ws.close();
            return;
          }

          // Validate session token
          const session = await validateSessionToken(sessionToken);
          if (!session) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid session" }));
            ws.close();
            return;
          }

          // Check if user already has an active connection
          const existingConnection = userConnections.get(session.userId);
          if (existingConnection && existingConnection !== ws) {
            // Disconnect the old connection
            existingConnection.send(JSON.stringify({ 
              type: "force_logout", 
              message: "Sesi Anda telah berakhir karena login di perangkat lain" 
            }));
            existingConnection.close();
            
            // Remove old connection from maps
            userConnections.delete(session.userId);
            if (existingConnection.data.sessionToken) {
              sessionConnections.delete(existingConnection.data.sessionToken);
            }
          }

          // Store connection info
          ws.data.userId = session.userId;
          ws.data.sessionToken = sessionToken;
          ws.data.userType = session.userType;

          // Add to tracking maps
          userConnections.set(session.userId, ws as SessionWebSocket);
          sessionConnections.set(sessionToken, ws as SessionWebSocket);

          // Send success response
          ws.send(JSON.stringify({ 
            type: "auth_success", 
            userId: session.userId,
            userType: session.userType 
          }));
          break;

        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;

        default:
          ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  },

  close(ws: SessionWebSocket) {
    // Clean up connections
    if (ws.data.userId) {
      userConnections.delete(ws.data.userId);
    }
    if (ws.data.sessionToken) {
      sessionConnections.delete(ws.data.sessionToken);
    }
    console.log("WebSocket connection closed");
  },

  error(ws: SessionWebSocket, error: Error) {
    console.error("WebSocket error:", error);
  }
};

// Helper function to validate session token
async function validateSessionToken(token: string): Promise<{ userId: string; userType: string } | null> {
  try {
    // Find session with this token
    const sessions = await db.sessions.findMany();
    
    for (const session of sessions) {
      try {
        const payload = JSON.parse(session.payload);
        if (payload.token === token) {
          // Check if session is expired
          if (new Date(payload.expires_at) < new Date()) {
            await db.sessions.delete({ where: { id: session.id } });
            return null;
          }
          
          return {
            userId: payload.user_id,
            userType: payload.user_type
          };
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

// Function to force disconnect a user (called from login endpoint)
export function forceDisconnectUser(userId: string) {
  const connection = userConnections.get(userId);
  if (connection) {
    connection.send(JSON.stringify({ 
      type: "force_logout", 
      message: "Sesi Anda telah berakhir karena login di perangkat lain" 
    }));
    connection.close();
    userConnections.delete(userId);
    if (connection.data.sessionToken) {
      sessionConnections.delete(connection.data.sessionToken);
    }
  }
}

// Function to disconnect by session token
export function disconnectSession(sessionToken: string) {
  const connection = sessionConnections.get(sessionToken);
  if (connection) {
    connection.send(JSON.stringify({ 
      type: "session_expired", 
      message: "Sesi Anda telah berakhir" 
    }));
    connection.close();
    if (connection.data.userId) {
      userConnections.delete(connection.data.userId);
    }
    sessionConnections.delete(sessionToken);
  }
}