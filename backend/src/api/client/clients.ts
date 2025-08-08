import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";

export default defineAPI({
  name: "clients",
  url: "/api/client/clients",
  async handler(args: any) {
    // Custom processing for slug generation
    if (args.action === "create" || args.action === "update") {
      // Generate slug from name if not provided
      if (!args.slug && args.name) {
        args.slug = args.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      // Set updated_at timestamp for updates
      if (args.action === "update") {
        args.updated_at = new Date();
      }
    }

    // Use the standard CRUD handler
    const handler = crudHandler("clients", {
      primaryKey: "id",
      softDelete: { 
        enabled: true, 
        field: "deleted_at", 
        method: "null_is_available" 
      },
      list: {
        prisma: {
          orderBy: { name: "asc" }
        }
      }
    });

    return await handler.call(this, args);
  }
});