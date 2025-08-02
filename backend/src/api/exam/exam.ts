import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import type { CreateExamRequest, ExamWithRelations } from "shared/types";

export default defineAPI({
  name: "exam",
  url: "/api/exam",
  handler: crudHandler("exams", {
    primaryKey: "id",
    list: {
      prisma: {
        include: {
          _count: {
            select: {
              deliveries: true,
              attempts: true
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
              groups: true
            }
          },
          _count: {
            select: {
              attempts: true
            }
          }
        }
      }
    },
    create: {
      before: (data: CreateExamRequest) => ({
        ...data,
        options: data.options ? JSON.stringify(data.options) : null,
        created_at: new Date(),
        updated_at: new Date()
      })
    },
    update: {
      before: (data: Partial<CreateExamRequest>) => ({
        ...data,
        options: data.options ? JSON.stringify(data.options) : undefined,
        updated_at: new Date()
      })
    }
  })
});