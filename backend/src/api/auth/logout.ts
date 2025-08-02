import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "auth_logout",
  url: "/api/auth/logout",
  async handler(arg: {}, { headers }: { headers: Headers }) {
    try {
      // Get session token from Authorization header
      const authHeader = headers.get('Authorization');
      const sessionToken = authHeader?.replace('Bearer ', '');

      if (!sessionToken) {
        return {
          success: false,
          message: "Token tidak ditemukan",
          status: 401
        };
      }

      // Find and delete session with this token
      const sessions = await db.sessions.findMany();
      
      for (const session of sessions) {
        try {
          const payload = JSON.parse(session.payload);
          if (payload.token === sessionToken) {
            await db.sessions.delete({
              where: { id: session.id }
            });
            
            return {
              success: true,
              message: "Logout berhasil"
            };
          }
        } catch (e) {
          // Skip malformed sessions
          continue;
        }
      }

      return {
        success: false,
        message: "Sesi tidak ditemukan",
        status: 401
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan server",
        status: 500
      };
    }
  }
});