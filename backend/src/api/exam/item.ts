import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import type { CreateItemRequest, ItemWithRelations } from "shared/types";

export default defineAPI({
  name: "exam_item",
  url: "/api/exam/item",
  handler: crudHandler("items", {
    primaryKey: "id",
    list: {
      prisma: {
        include: {
          questions: {
            include: {
              answers: true
            }
          },
          _count: {
            select: {
              questions: true
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
          questions: {
            include: {
              answers: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      }
    },
    create: {
      before: (data: CreateItemRequest) => ({
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }),
      after: async (result) => {
        // Link categories if provided - this would need to be handled differently
        // since we don't have access to the original data in the after hook
        // Consider moving this logic to the before hook or a separate API call
      }
    },
    update: {
      before: (data: Partial<CreateItemRequest>) => ({
        ...data,
        updated_at: new Date()
      })
    }
  })
});