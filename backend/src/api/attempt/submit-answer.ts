import { defineAPI } from "rlib/server";
import type { SubmitAnswerRequest } from "shared/types";
import { db } from "@/lib/db";

export default defineAPI({
  name: "attempt_submit_answer",
  url: "/api/attempt/answer",
  async handler(data: SubmitAnswerRequest) {
    // Get attempt by hash (we'll use ID for now)
    const attemptId = parseInt(data.attempt_hash); // TODO: Implement proper hash
    
    const attempt = await db.attempts.findUnique({
      where: { id: attemptId }
    });
    
    if (!attempt) {
      throw new Error('Attempt tidak ditemukan');
    }
    
    if (attempt.ended_at) {
      throw new Error('Ujian sudah selesai');
    }
    
    // Process each answer
    for (const [questionHash, answer] of Object.entries(data.answers)) {
      const questionId = parseInt(questionHash); // TODO: Implement proper hash
      
      if (!answer) continue;
      
      // Check if answer already exists
      const existingAnswer = await db.attempt_question.findFirst({
        where: {
          attempt_id: attemptId,
          question_id: questionId
        }
      });
      
      if (existingAnswer) {
        // Update existing answer
        await db.attempt_question.update({
          where: { id: existingAnswer.id },
          data: {
            answer: answer,
            answer_hash: answer, // For MCQ answers
            updated_at: new Date()
          }
        });
      } else {
        // Create new answer
        await db.attempt_question.create({
          data: {
            attempt_id: attemptId,
            question_id: questionId,
            answer: answer,
            answer_hash: answer, // For MCQ answers
            is_correct: false, // Will be calculated during scoring
            score: 0,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }
    }
    
    // Update attempt progress
    const itemIds = await db.$queryRaw<{item_id: number}[]>`
      SELECT item_id FROM exam_item WHERE exam_id = ${attempt.exam_id}
    `;
    
    const totalQuestions = await db.questions.count({
      where: {
        item_id: {
          in: itemIds.map(i => i.item_id)
        }
      }
    });
    
    const answeredQuestions = await db.attempt_question.count({
      where: { attempt_id: attemptId }
    });
    
    const progress = totalQuestions > 0 
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;
    
    await db.attempts.update({
      where: { id: attemptId },
      data: {
        progress,
        updated_at: new Date()
      }
    });
    
    return { success: true, progress };
  }
});