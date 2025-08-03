import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "admin_dashboard",
  url: "/api/admin/dashboard",
  async handler(arg: {}) {
    try {
      const req = this.req!;
      
      // Check admin authentication
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return {
          success: false,
          message: "Unauthorized",
          status: 401
        };
      }
      
      // Get statistics
      const [
        totalTakers,
        totalQuestions,
        activeExams,
        todayResults,
        recentResults,
        examStats
      ] = await Promise.all([
        // Total registered takers
        db.takers.count(),
        
        // Total questions
        db.questions.count(),
        
        // Active exams (ongoing attempts)
        db.attempts.count({
          where: {
            started_at: {
              not: null
            },
            ended_at: null
          }
        }),
        
        // Today's completed attempts
        db.attempts.count({
          where: {
            ended_at: {
              not: null,
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // Recent exam results (last 5 attempts)
        db.attempts.findMany({
          where: {
            ended_at: {
              not: null
            }
          },
          include: {
            takers: {
              select: {
                id: true,
                name: true,
                reg: true
              }
            },
            exams: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            ended_at: 'desc'
          },
          take: 5
        }),
        
        // Overall exam statistics
        db.attempts.aggregate({
          where: {
            ended_at: {
              not: null
            }
          },
          _avg: {
            score: true
          },
          _count: {
            id: true
          }
        })
      ]);
      
      // Calculate passing rate
      const passingResults = await db.attempts.count({
        where: {
          ended_at: {
            not: null
          },
          score: {
            gte: 70
          }
        }
      });
      
      const totalCompleted = examStats._count.id || 1;
      const passingRate = Math.round((passingResults / totalCompleted) * 100);
      
      // Get category distribution for questions
      const categoryStats = await db.categories.findMany({
        select: {
          id: true,
          name: true
        }
      });
      
      return {
        success: true,
        data: {
          statistics: {
            totalTakers,
            totalQuestions,
            activeExams,
            todayResults,
            averageScore: Math.round(Number(examStats._avg.score) || 0),
            passingRate,
            totalExams: totalCompleted
          },
          recentResults: recentResults.map((result: any) => ({
            id: result.id,
            takerName: result.takers?.name,
            takerReg: result.takers?.reg,
            examTitle: result.exams?.name,
            score: result.score,
            finishedAt: result.ended_at,
            passed: result.score >= 70
          })),
          categoryDistribution: categoryStats.map((cat: any) => ({
            category_name: cat.name,
            question_count: 0
          }))
        }
      };
    } catch (error) {
      console.error("Dashboard error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan server"
      };
    }
  }
});