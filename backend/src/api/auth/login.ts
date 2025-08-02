import { defineAPI } from "rlib/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export default defineAPI({
  name: "auth_login",
  url: "/api/auth/login",
  async handler(arg: { username: string; password: string; user_type?: string }) {
    try {
      const { username, password, user_type = "taker" } = arg;

      // Find user by email or username based on user type
      let user: any = null;
      let userTableId: string | null = null;

      switch (user_type) {
        case "taker":
          // Takers login with their reg number or email
          const taker = await db.takers.findFirst({
            where: {
              OR: [
                { email: username },
                { reg: username }
              ]
            }
          });
          
          if (taker) {
            user = {
              id: taker.id,
              email: taker.email,
              username: taker.reg || taker.email,
              password: taker.password,
              user_type: "taker",
              taker: taker
            };
            userTableId = taker.id.toString();
          }
          break;

        case "internal":
          // Internal users (admins) use the users table
          const internalUser = await db.users.findFirst({
            where: {
              OR: [
                { email: username },
                { username: username }
              ]
            }
          });
          
          if (internalUser) {
            user = {
              id: internalUser.id,
              email: internalUser.email,
              username: internalUser.username,
              password: internalUser.password,
              user_type: "internal",
              internal: internalUser
            };
            userTableId = internalUser.id.toString();
          }
          break;

        default:
          return {
            success: false,
            message: "Tipe pengguna tidak valid"
          };
      }

      if (!user) {
        return {
          success: false,
          message: "Username atau password salah"
        };
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return {
          success: false,
          message: "Username atau password salah"
        };
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionId = crypto.randomBytes(16).toString('hex');

      // Create session
      await db.sessions.create({
        data: {
          id: sessionId,
          user_id: BigInt(userTableId!),
          payload: JSON.stringify({
            token: sessionToken,
            user_type: user_type,
            user_id: userTableId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }),
          last_activity: Math.floor(Date.now() / 1000)
        }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token: sessionToken,
          session_id: sessionId
        },
        message: "Login berhasil"
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan saat login"
      };
    }
  }
});