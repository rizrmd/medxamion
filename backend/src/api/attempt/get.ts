import { defineAPI } from "rlib/server";
import { db } from "@/lib/db";

export default defineAPI({
  name: "attempt_get",
  url: "/api/attempt/get",
  async handler(data: { attempt_id: number }) {
    const attempt = await db.attempts.findUnique({
      where: { id: data.attempt_id },
      include: {
        takers: true,
        exams: true,
        deliveries: true,
        attempt_question: {
          include: {
            questions: true
          }
        }
      }
    });
    
    if (!attempt) {
      throw new Error('Attempt tidak ditemukan');
    }
    
    return attempt;
  }
});