import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";

export default defineAPI({
  name: "admin_questions",
  url: "/api/admin/questions",
  handler: crudHandler("questions", {
    primaryKey: "id",
    softDelete: {
      enabled: true,
      field: "deleted_at",
      method: "null_is_available"
    },
    list: {
      prisma: {
        orderBy: { created_at: "desc" },
        include: {
          question_options: true,
          question_categories: {
            include: {
              category: true
            }
          }
        }
      }
    },
    get: {
      prisma: {
        include: {
          question_options: true,
          question_categories: {
            include: {
              category: true
            }
          }
        }
      }
    },
    create: {
      afterCreate: async (createdData, originalData) => {
        // Handle question options for multiple choice questions
        if (originalData.type === 'multiple_choice' && originalData.options) {
          const options = originalData.options as any[];
          
          for (let i = 0; i < options.length; i++) {
            await db.question_options.create({
              data: {
                question_id: createdData.id,
                option_text: options[i].text,
                is_correct: options[i].is_correct || false,
                option_order: i + 1
              }
            });
          }
        }
        
        // Handle categories
        if (originalData.categories && Array.isArray(originalData.categories)) {
          for (const categoryId of originalData.categories) {
            await db.question_categories.create({
              data: {
                question_id: createdData.id,
                category_id: parseInt(categoryId)
              }
            });
          }
        }
        
        return createdData;
      }
    },
    update: {
      afterUpdate: async (updatedData, originalData) => {
        // Update question options
        if (originalData.type === 'multiple_choice' && originalData.options) {
          // Delete existing options
          await db.question_options.deleteMany({
            where: { question_id: updatedData.id }
          });
          
          // Create new options
          const options = originalData.options as any[];
          for (let i = 0; i < options.length; i++) {
            await db.question_options.create({
              data: {
                question_id: updatedData.id,
                option_text: options[i].text,
                is_correct: options[i].is_correct || false,
                option_order: i + 1
              }
            });
          }
        }
        
        // Update categories
        if (originalData.categories !== undefined) {
          // Delete existing category associations
          await db.question_categories.deleteMany({
            where: { question_id: updatedData.id }
          });
          
          // Create new associations
          if (Array.isArray(originalData.categories)) {
            for (const categoryId of originalData.categories) {
              await db.question_categories.create({
                data: {
                  question_id: updatedData.id,
                  category_id: parseInt(categoryId)
                }
              });
            }
          }
        }
        
        return updatedData;
      }
    }
  })
});