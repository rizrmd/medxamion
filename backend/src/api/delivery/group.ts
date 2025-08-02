import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import type { GroupWithRelations } from "shared/types";

export default defineAPI({
  name: "delivery_group",
  url: "/api/delivery/group",
  handler: crudHandler("groups", {
    primaryKey: "id",
    list: {
      prisma: {
        include: {
          _count: {
            select: {
              deliveries: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      }
    },
    get: {
      prisma: {
        include: {
          deliveries: {
            include: {
              exams: true
            }
          }
        }
      }
    },
    create: {
      before: (data: Partial<GroupWithRelations>) => ({
        ...data,
        code: data.code || generateGroupCode(),
        last_taker_code: 1,
        created_at: new Date(),
        updated_at: new Date()
      })
    },
    update: {
      before: (data: Partial<GroupWithRelations>) => ({
        ...data,
        updated_at: new Date()
      })
    }
  })
});

function generateGroupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}