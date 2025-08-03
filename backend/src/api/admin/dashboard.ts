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
        db.takers.count({
          where: {
            deleted_at: null,
            status: 'active'
          }
        }),
        
        // Total questions
        db.questions.count({
          where: {
            deleted_at: null
          }
        }),
        
        // Active exams (ongoing)
        db.exam_results.count({
          where: {
            status: 'in_progress',
            created_at: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // Today's completed exams
        db.exam_results.count({
          where: {
            status: 'completed',
            created_at: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // Recent exam results (last 5)
        db.exam_results.findMany({
          where: {
            status: 'completed'
          },
          include: {
            taker: {
              select: {
                id: true,
                name: true,
                reg: true
              }
            },
            exam: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            finished_at: 'desc'
          },
          take: 5
        }),
        
        // Overall exam statistics
        db.exam_results.aggregate({
          where: {
            status: 'completed'
          },
          _avg: {
            score: true,
            duration: true
          },
          _count: {
            id: true
          }
        })
      ]);
      
      // Calculate passing rate
      const passingResults = await db.exam_results.count({
        where: {
          status: 'completed',
          score: {
            gte: 70
          }
        }
      });
      
      const totalCompleted = examStats._count.id || 1;
      const passingRate = Math.round((passingResults / totalCompleted) * 100);
      
      // Get category distribution for questions
      const categoryStats = await db.$queryRaw`
        SELECT 
          c.name as category_name,
          COUNT(DISTINCT qc.question_id) as question_count
        FROM categories c
        LEFT JOIN question_categories qc ON c.id = qc.category_id
        LEFT JOIN questions q ON qc.question_id = q.id AND q.deleted_at IS NULL
        GROUP BY c.id, c.name
        ORDER BY question_count DESC
      `;
      
      return {
        success: true,
        data: {
          statistics: {
            totalTakers,
            totalQuestions,
            activeExams,
            todayResults,
            averageScore: Math.round(examStats._avg.score || 0),
            averageDuration: Math.round(examStats._avg.duration || 0),
            passingRate,
            totalExams: totalCompleted
          },
          recentResults: recentResults.map(result => ({
            id: result.id,
            takerName: result.taker?.name,
            takerReg: result.taker?.reg,
            examTitle: result.exam?.title,
            score: result.score,
            duration: result.duration,
            finishedAt: result.finished_at,
            passed: result.score >= 70
          })),
          categoryDistribution: categoryStats
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