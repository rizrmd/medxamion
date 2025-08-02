import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "auth_me",
  url: "/api/auth/me",
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
        return {
          success: false,
          message: "Invalid or expired session",
          status: 401
        };
      }

      // Prepare user data based on user type
      let userData: any = null;

      if (session.user_type === "taker") {
        userData = {
          id: `taker_${session.taker?.id}`,
          email: session.taker?.email,
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
        };
      }

      return {
        success: true,
        data: {
          user: userData,
          session: {
            token: sessionToken,
            expires_at: session.expires_at,
            user_type: session.user_type
          }
        }
      };

    } catch (error) {
      console.error("Session verification error:", error);
      return {
        success: false,
        message: "Internal server error",
        status: 500
      };
    }
  }
});