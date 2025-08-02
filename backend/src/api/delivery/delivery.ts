import { defineAPI } from "rlib/server";
import { crudHandler } from "@/lib/crud-handler";
import type { DeliveryWithRelations } from "shared/types";
import { db } from "@/lib/db";

export default defineAPI({
  name: "delivery",
  url: "/api/delivery",
  handler: crudHandler("deliveries", {
    primaryKey: "id",
    list: {
      prisma: {
        include: {
          exams: true,
          groups: true,
          _count: {
            select: {
              attempts: true
            }
          }
        },
        orderBy: {
          scheduled_at: 'desc'
        }
      }
    },
    get: {
      prisma: {
        include: {
          exams: {
            include: {
              items: {
                include: {
                  questions: {
                    include: {
                      answers: true
                    }
                  }
                }
              }
            }
          },
          groups: true,
          attempts: {
            include: {
              takers: true
            }
          }
        }
      }
    },
    create: {
      before: (data: Partial<DeliveryWithRelations>) => ({
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }),
      after: async (result) => {
        // Generate tokens for all takers in the group
        if (result.group_id) {
          const groupTakers = await db.$queryRaw<{taker_id: number}[]>`
            SELECT taker_id FROM group_taker WHERE group_id = ${result.group_id}
          `;
          
          if (groupTakers.length > 0) {
            const tokenData = groupTakers.map(gt => ({
              delivery_id: result.id,
              taker_id: gt.taker_id,
              token: generateToken(),
              is_login: false
            }));
            
            await db.$executeRawUnsafe(`
              INSERT INTO delivery_taker (delivery_id, taker_id, token, is_login)
              VALUES ${tokenData.map(td => `(${td.delivery_id}, ${td.taker_id}, '${td.token}', ${td.is_login})`).join(', ')}
            `);
          }
        }
      }
    },
    update: {
      before: (data: Partial<DeliveryWithRelations>) => ({
        ...data,
        updated_at: new Date()
      })
    }
  })
});

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}