import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import type { TakerWithRelations } from "shared/types";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export default defineAPI({
  name: "delivery_taker",
  url: "/api/delivery/taker",
  handler: crudHandler("takers", {
    primaryKey: "id",
    list: {
      prisma: {
        orderBy: {
          name: 'asc'
        }
      }
    },
    get: {
      prisma: {
        include: {
          attempts: true
        }
      }
    },
    create: {
      before: async (data: Partial<TakerWithRelations>) => ({
        ...data,
        password: data.password ? await bcrypt.hash(data.password, 10) : null,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      })
    },
    update: {
      before: async (data: Partial<TakerWithRelations>) => {
        const updateData: any = {
          ...data,
          updated_at: new Date()
        };
        
        // Hash password if provided
        if (data.password) {
          updateData.password = await bcrypt.hash(data.password, 10);
        }
        
        return updateData;
      }
    }
  })
});