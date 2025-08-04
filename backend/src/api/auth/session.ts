import { defineAPI } from "rlib/server";
import { getSession } from "@/lib/auth-utils";

export default defineAPI({
  name: "auth_session",
  url: "/api/auth/session",
  async handler() {
    try {
      const headers = this.req?.headers;
      if (!headers) {
        return {
          success: false,
          message: "No headers found"
        };
      }

      const session = await getSession(headers);
      
      if (!session) {
        return {
          success: false,
          message: "No active session"
        };
      }

      return {
        success: true,
        data: {
          token: session.token,
          user_type: session.user_type,
          expires_at: session.expires_at
        }
      };
    } catch (error) {
      console.error("Session check error:", error);
      return {
        success: false,
        message: "Failed to check session"
      };
    }
  }
});