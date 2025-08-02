import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import type { CreateQuestionRequest, QuestionWithRelations } from "shared/types";

export default defineAPI({
  name: "exam_question",
  url: "/api/exam/question",
  handler: crudHandler("questions", {
    primaryKey: "id",
    list: {
      prisma: {
        include: {
          answers: true,
          items: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    },
    get: {
      prisma: {
        include: {
          answers: {
            orderBy: {
              id: 'asc'
            }
          },
          items: true
        }
      }
    },
    create: {
      before: (data: CreateQuestionRequest) => {
        const { answers, ...questionData } = data;
        return {
          ...questionData,
          created_at: new Date(),
          updated_at: new Date()
        };
      },
      after: async (result) => {
        // Create answers if provided - this would need to be handled differently
        // since we don't have access to the original data in the after hook
        // Consider moving this logic to the before hook or a separate API call
      }
    },
    update: {
      before: (data: Partial<CreateQuestionRequest>) => {
        const { answers, ...questionData } = data;
        return {
          ...questionData,
          updated_at: new Date()
        };
      }
    }
  })
});