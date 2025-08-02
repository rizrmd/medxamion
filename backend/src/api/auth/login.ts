import { defineAPI } from "rlib/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export default defineAPI({
  name: "auth_login",
  url: "/api/auth/login",
  async handler(arg: { username: string; password: string; user_type?: string }) {
    try {
      const { username, password, user_type = "customer" } = arg;

      // Find user by email or username based on user type
      let user: any = null;
      let userTableId: string | null = null;

      switch (user_type) {
        case "customer":
          user = await db.auth_user.findFirst({
            where: {
              OR: [
                { email: username },
                { username: username }
              ],
              id_customer: { not: null }
            },
            include: {
              customer: true
            }
          });
          userTableId = user?.id_customer;
          break;

        case "taker":
          // Takers login with their username/email
          const taker = await db.takers.findFirst({
            where: {
              OR: [
                { email: username },
                { username: username }
              ]
            },
            include: {
              groups: true
            }
          });
          
          if (taker) {
            // For takers, we use their record directly (no auth_user table)
            user = {
              id: `taker_${taker.id}`,
              email: taker.email,
              username: taker.username,
              password: taker.password,
              taker: taker
            };
            userTableId = taker.id;
          }
          break;

        case "author":
          user = await db.auth_user.findFirst({
            where: {
              OR: [
                { email: username },
                { username: username }
              ],
              id_author: { not: null }
            },
            include: {
              author: true
            }
          });
          userTableId = user?.id_author;
          break;

        case "internal":
          user = await db.auth_user.findFirst({
            where: {
              OR: [
                { email: username },
                { username: username }
              ],
              id_internal: { not: null }
            },
            include: {
              internal: true
            }
          });
          userTableId = user?.id_internal;
          break;
      }

      if (!user) {
        return {
          success: false,
          message: "Invalid credentials",
          status: 401
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: "Invalid credentials", 
          status: 401
        };
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create session
      await db.auth_session.create({
        data: {
          id: sessionToken,
          id_auth_user: user_type === "taker" ? null : user.id,
          id_taker: user_type === "taker" ? userTableId : null,
          user_type: user_type,
          expires_at: expiresAt,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          session: {
            token: sessionToken,
            expires_at: expiresAt,
            user_type: user_type
          }
        }
      };

    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Internal server error",
        status: 500
      };
    }
  }
});