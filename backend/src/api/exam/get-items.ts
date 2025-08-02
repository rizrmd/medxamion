import { defineAPI } from "rlib/server";
import { db } from "@/lib/db";

export default defineAPI({
  name: "exam_get_items",
  url: "/api/exam/get-items",
  async handler(data: { exam_id: number }) {
    const itemIds = await db.$queryRaw<{item_id: number, order: number}[]>`
      SELECT item_id, "order" FROM exam_item 
      WHERE exam_id = ${data.exam_id}
      ORDER BY "order" ASC
    `;
    
    if (itemIds.length === 0) return [];
    
    const items = await db.items.findMany({
      where: {
        id: { in: itemIds.map(i => i.item_id) }
      },
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
    });
    
    // Sort items by exam_item order
    return itemIds.map(ei => items.find(item => item.id === ei.item_id)).filter(Boolean);
  }
});