import { defineAPI } from "rlib/server";
import type { StartAttemptRequest } from "shared/types";
import { db } from "@/lib/db";

export default defineAPI({
  name: "attempt_start",
  url: "/api/attempt/start",
  async handler(data: StartAttemptRequest) {
    // Validate delivery and taker
    const delivery = await db.deliveries.findUnique({
      where: { id: data.delivery_id },
      include: { exams: true }
    });
    
    if (!delivery) {
      throw new Error('Delivery tidak ditemukan');
    }
    
    // Check if taker is registered for this delivery
    const deliveryTaker = await db.$queryRaw<{token: string}[]>`
      SELECT token FROM delivery_taker 
      WHERE delivery_id = ${data.delivery_id} AND taker_id = ${data.taker_id}
    `;
    
    if (!deliveryTaker.length) {
      throw new Error('Anda tidak terdaftar untuk ujian ini');
    }
    
    // Validate token if provided
    if (data.token && deliveryTaker[0]?.token !== data.token) {
      throw new Error('Token tidak valid');
    }
    
    // Check for existing attempt
    const existingAttempt = await db.attempts.findFirst({
      where: {
        delivery_id: data.delivery_id,
        attempted_by: data.taker_id
      }
    });
    
    if (existingAttempt) {
      return existingAttempt;
    }
    
    // Create new attempt
    const attempt = await db.attempts.create({
      data: {
        attempted_by: data.taker_id,
        exam_id: delivery.exam_id,
        delivery_id: data.delivery_id,
        ip_address: '0.0.0.0', // TODO: Get from request
        started_at: new Date(),
        extra_minute: 0,
        score: 0,
        progress: 0,
        penalty: 0,
        finish_scoring: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Update delivery_taker login status
    await db.$executeRawUnsafe(`
      UPDATE delivery_taker 
      SET is_login = true 
      WHERE delivery_id = ${data.delivery_id} AND taker_id = ${data.taker_id}
    `);
    
    return attempt;
  }
});