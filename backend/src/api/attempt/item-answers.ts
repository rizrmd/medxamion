import { defineAPI } from "rlib/server";
import { db } from "@/lib/db";

export default defineAPI({
  name: "attempt_get_item_answers",
  url: "/api/attempt/item-answers",
  async handler(data: { attempt_id: number, item_id: number }) {
    const questions = await db.questions.findMany({
      where: { item_id: data.item_id },
      include: {
        attempt_question: {
          where: { attempt_id: data.attempt_id }
        }
      }
    });
    
    return questions.map(q => ({
      question_id: q.id,
      answer: q.attempt_question[0]?.answer || null,
      answer_hash: q.attempt_question[0]?.answer_hash || null
    }));
  }
});