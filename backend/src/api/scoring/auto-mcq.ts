import { defineAPI } from "rlib/server";
import { db } from "@/lib/db";
import type { ScoreResult } from "shared/types";

export default defineAPI({
  name: "scoring_auto_mcq",
  url: "/api/scoring/auto-mcq",
  async handler(data: { attempt_id: number }): Promise<ScoreResult> {
    const attempt = await db.attempts.findUnique({
      where: { id: data.attempt_id },
      include: {
        exams: true,
        attempt_question: {
          include: {
            questions: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    });
    
    if (!attempt) {
      throw new Error('Attempt tidak ditemukan');
    }
    
    if (!attempt.exams?.is_mcq) {
      throw new Error('Ujian ini bukan tipe MCQ');
    }
    
    let totalScore = 0;
    let totalMaxScore = 0;
    const details: ScoreResult['details'] = [];
    
    // Score each question
    for (const aq of attempt.attempt_question) {
      const question = aq.questions;
      if (!question) continue;
      
      const maxScore = question.score;
      totalMaxScore += maxScore;
      
      let score = 0;
      
      // Check if answer is correct
      if (aq.answer_hash) {
        const correctAnswer = question.answers?.find((a: any) => a.is_correct_answer);
        if (correctAnswer && aq.answer_id === correctAnswer.id) {
          score = maxScore;
          await db.attempt_question.update({
            where: { id: aq.id },
            data: {
              is_correct: true,
              score: score
            }
          });
        }
      }
      
      totalScore += score;
      details.push({
        question_id: question.id,
        score,
        max_score: maxScore
      });
    }
    
    const percentage = totalMaxScore > 0 
      ? Math.round((totalScore / totalMaxScore) * 100)
      : 0;
    
    // Update attempt score
    await db.attempts.update({
      where: { id: data.attempt_id },
      data: {
        score: totalScore,
        finish_scoring: true,
        updated_at: new Date()
      }
    });
    
    return {
      attempt_id: data.attempt_id,
      total_score: totalScore,
      percentage,
      passed: percentage >= 70, // TODO: Get from exam settings
      details
    };
  }
});