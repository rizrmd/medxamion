import { defineAPI } from "rlib/server";

// This API is kept for backward compatibility
// New client management should use /api/client/clients
export default defineAPI({
  name: "client_list",
  url: "/api/client/list",
  async handler() {
    const clients = await db.clients.findMany({
      where: { deleted_at: null, is_active: true },
      orderBy: { name: "asc" }
    });
    
    return {
      success: true,
      data: clients
    };
  }
});