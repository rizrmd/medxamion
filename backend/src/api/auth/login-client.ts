import { defineClientAPI } from "@/lib/client-api";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default defineClientAPI({
  name: "auth_login_client",
  url: "/api/auth/login-client",
  options: { requireClient: true },
  async handler(arg: { username: string; password: string }) {
    const client = this.client!;
    
    // Find user within client context
    const user = await db.users.findFirst({
      where: {
        client_id: client.clientId,
        OR: [
          { email: arg.username },
          { username: arg.username }
        ],
        deleted_at: null
      }
    });
    
    if (!user) {
      return {
        success: false,
        message: "Username atau password salah"
      };
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(arg.password, user.password);
    if (!validPassword) {
      return {
        success: false,
        message: "Username atau password salah"
      };
    }
    
    // Create JWT token with client context
    const token = jwt.sign(
      {
        userId: user.id,
        clientId: client.clientId,
        clientSlug: client.clientSlug,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    
    // Update last login
    await db.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });
    
    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          client_id: user.client_id
        }
      }
    };
  }
});