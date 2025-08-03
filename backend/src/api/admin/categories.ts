import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";

export default defineAPI({
  name: "admin_categories", 
  url: "/api/admin/categories",
  handler: crudHandler("categories", {
    primaryKey: "id",
    softDelete: {
      enabled: true,
      field: "deleted_at",
      method: "null_is_available"
    },
    list: {
      prisma: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              question_categories: true
            }
          }
        }
      }
    }
  })
});