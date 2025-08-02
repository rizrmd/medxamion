import { defineAPI } from "rlib/server";
import { db } from "@/lib/db";

export default defineAPI({
  name: "attempt_finish", 
  url: "/api/attempt/finish",
  async handler(data: { attempt_id: number }) {
    const attempt = await db.attempts.findUnique({
      where: { id: data.attempt_id }
    });
    
    if (!attempt) {
      throw new Error('Attempt tidak ditemukan');
    }
    
    if (attempt.ended_at) {
      throw new Error('Ujian sudah selesai');
    }
    
    // Update attempt
    await db.attempts.update({
      where: { id: data.attempt_id },
      data: {
        ended_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // TODO: Trigger auto-scoring for MCQ questions
    
    return { success: true };
  }
});