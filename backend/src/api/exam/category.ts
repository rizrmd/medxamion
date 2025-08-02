import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import type { categories } from "shared/models";

export default defineAPI({
  name: "exam_category",
  url: "/api/exam/category",
  handler: crudHandler("categories", {
    primaryKey: "id",
    list: {
      prisma: {
        orderBy: {
          name: 'asc'
        }
      }
    },
    create: {
      before: (data: Partial<categories>) => ({
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      })
    },
    update: {
      before: (data: Partial<categories>) => ({
        ...data,
        updated_at: new Date()
      })
    }
  })
});