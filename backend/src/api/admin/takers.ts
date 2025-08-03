import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import bcrypt from "bcryptjs";

export default defineAPI({
  name: "admin_takers",
  url: "/api/admin/takers",
  handler: crudHandler("takers", {
    primaryKey: "id",
    softDelete: {
      enabled: false,
      field: "deleted_at",
      method: "null_is_available"
    },
    list: {
      prisma: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          reg: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          created_at: true,
          updated_at: true,
          deleted_at: true
        }
      }
    },
    get: {
      prisma: {
        select: {
          id: true,
          reg: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          created_at: true,
          updated_at: true
        }
      }
    },
    create: {
      before: async (data: any) => {
        // Generate registration number if not provided
        if (!data.reg) {
          const count = await db.takers.count();
          data.reg = `T${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`;
        }
        
        // Hash password
        if (data.password) {
          const bcrypt = await import('bcryptjs');
          data.password = await bcrypt.hash(data.password, 10);
        } else {
          // Generate default password from reg number
          const bcrypt = await import('bcryptjs');
          data.password = await bcrypt.hash(data.reg, 10);
        }
        
        // Set default status
        if (!data.status) {
          data.status = 'active';
        }
        
        return data;
      }
    },
    update: {
      before: async (data: any) => {
        // Hash password if provided
        if (data.password) {
          const bcrypt = await import('bcryptjs');
          data.password = await bcrypt.hash(data.password, 10);
        }
        
        return data;
      }
    }
  })
});