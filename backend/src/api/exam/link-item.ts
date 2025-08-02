import { defineAPI } from "rlib/server";
import { db } from "@/lib/db";

export default defineAPI({
  name: "exam_link_item",
  url: "/api/exam/link-item",
  async handler(data: { exam_id: number, item_id: number, order?: number }) {
    // Get max order if not provided
    let order = data.order;
    if (!order) {
      const maxOrder = await db.$queryRaw<{max_order: number}[]>`
        SELECT COALESCE(MAX("order"), 0) as max_order 
        FROM exam_item 
        WHERE exam_id = ${data.exam_id}
      `;
      order = (maxOrder[0]?.max_order || 0) + 1;
    }
    
    await db.$executeRawUnsafe(`
      INSERT INTO exam_item (exam_id, item_id, "order")
      VALUES (${data.exam_id}, ${data.item_id}, ${order})
      ON CONFLICT (exam_id, item_id) DO UPDATE SET "order" = ${order}
    `);
    
    return { success: true };
  }
});