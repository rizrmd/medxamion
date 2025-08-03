import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";

export default defineAPI({
  name: "admin_questions",
  url: "/api/admin/questions",
  handler: crudHandler("questions", {
    primaryKey: "id",
    softDelete: {
      enabled: false,
      field: "deleted_at",
      method: "null_is_available"
    },
    list: {
      prisma: {
        orderBy: { created_at: "desc" },
        include: {
          answers: true,
          category_question: {
            include: {
              categories: true
            }
          }
        }
      }
    },
    get: {
      prisma: {
        include: {
          answers: true,
          category_question: {
            include: {
              categories: true
            }
          }
        }
      }
    },
  })
});