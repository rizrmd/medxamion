import { defineAPI } from "rlib/server";
import { getSession } from "../lib/auth-utils";

export default defineAPI({
  name: "get_session_with_token",
  url: "/api/get-session-with-token",
  async handler(arg: {}, { headers }: { headers: Headers }) {
    try {
      // Get the session data using our Laravel-style auth
      const sessionData = await getSession(headers);
      
      if (!sessionData) {
        return {
          success: false,
          message: "No valid session found",
          status: 401
        };
      }
      
      return {
        success: true,
        data: {
          user: sessionData.user,
          session: {
            token: sessionData.token,
            expires_at: sessionData.expires_at,
            user_type: sessionData.user_type
          },
          sessionToken: sessionData.token
        }
      };
    } catch (error) {
      console.error("Session retrieval error:", error);
      return {
        success: false,
        message: "Internal server error",
        status: 500
      };
    }
  },
});