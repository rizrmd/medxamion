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
          message: "No session token provided",
          status: 401
        };
      }

      // Delete the session
      await db.auth_session.delete({
        where: {
          id: sessionToken
        }
      });

      return {
        success: true,
        message: "Logged out successfully"
      };

    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Internal server error",
        status: 500
      };
    }
  }
});