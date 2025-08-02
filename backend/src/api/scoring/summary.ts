import { defineAPI } from "rlib/server";
import { db } from "@/lib/db";

export default defineAPI({
  name: "scoring_summary",
  url: "/api/scoring/summary", 
  async handler(data: { delivery_id: number }) {
    const attempts = await db.attempts.findMany({
      where: { delivery_id: data.delivery_id },
      include: {
        takers: true
      }
    });
    
    const summary = {
      total_takers: attempts.length,
      completed: attempts.filter((a: any) => a.ended_at).length,
      scored: attempts.filter((a: any) => a.finish_scoring).length,
      average_score: 0,
      highest_score: 0,
      lowest_score: 100,
      attempts: attempts.map((a: any) => ({
        id: a.id,
        taker_name: a.takers?.name || '',
        score: Number(a.score),
        progress: a.progress,
        status: a.finish_scoring ? 'scored' : a.ended_at ? 'completed' : 'in_progress'
      }))
    };
    
    const scoredAttempts = attempts.filter((a: any) => a.finish_scoring);
    if (scoredAttempts.length > 0) {
      const scores = scoredAttempts.map((a: any) => Number(a.score));
      summary.average_score = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      summary.highest_score = Math.max(...scores);
      summary.lowest_score = Math.min(...scores);
    }
    
    return summary;
  }
});