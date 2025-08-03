import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "auth_me",
  url: "/api/auth/me",
  async handler(arg: {}) {
    try {
      // Get session token from Authorization header
      const req = this.req!;
      const authHeader = req.headers.get('Authorization');
      const sessionToken = authHeader?.replace('Bearer ', '');

      if (!sessionToken) {
        return {
          success: false,
          message: "Token tidak ditemukan",
          status: 401
        };
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
              return {
                success: false,
                message: "Sesi telah kadaluarsa",
                status: 401
              };
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
        return {
          success: false,
          message: "Sesi tidak ditemukan",
          status: 401
        };
      }

      // Update last activity
      await db.sessions.update({
        where: { id: foundSession.id },
        data: { last_activity: Math.floor(Date.now() / 1000) }
      });

      // Get user data based on user type
      let userData: any = null;
      
      if (sessionPayload.user_type === "taker") {
        const taker = await db.takers.findUnique({
          where: { id: parseInt(sessionPayload.user_id) }
        });
        
        if (taker) {
          userData = {
            id: taker.id,
            email: taker.email,
            username: taker.reg || taker.email,
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
        return {
          success: false,
          message: "Pengguna tidak ditemukan",
          status: 404
        };
      }

      return {
        success: true,
        data: {
          user: userData,
          session: {
            token: sessionToken,
            expires_at: sessionPayload.expires_at,
            user_type: sessionPayload.user_type
          }
        }
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan server",
        status: 500
      };
    }
  }
});