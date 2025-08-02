import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import type { answers } from "shared/models";

export default defineAPI({
  name: "exam_answer",
  url: "/api/exam/answer",
  handler: crudHandler("answers", {
    primaryKey: "id",
    list: {
      prisma: {
        include: {
          questions: true
        }
      }
    },
    create: {
      before: (data: Partial<answers>) => ({
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      })
    },
    update: {
      before: (data: Partial<answers>) => ({
        ...data,
        updated_at: new Date()
      })
    },
    delete: {
      // Cascade is handled by database
    }
  })
});