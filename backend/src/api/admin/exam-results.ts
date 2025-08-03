import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "admin_exam_results",
  url: "/api/admin/exam-results",
  async handler(arg: {
    action?: string;
    exam_id?: number;
    taker_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const req = this.req!;
      const action = arg.action || 'list';
      
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
      
      switch (action) {
        case 'list':
          const page = arg.page || 1;
          const limit = arg.limit || 20;
          const offset = (page - 1) * limit;
          
          const where: any = {};
          
          if (arg.exam_id) {
            where.exam_id = arg.exam_id;
          }
          
          if (arg.taker_id) {
            where.taker_id = arg.taker_id;
          }
          
          if (arg.date_from || arg.date_to) {
            where.created_at = {};
            if (arg.date_from) {
              where.created_at.gte = new Date(arg.date_from);
            }
            if (arg.date_to) {
              where.created_at.lte = new Date(arg.date_to);
            }
          }
          
          const [results, total] = await Promise.all([
            db.exam_results.findMany({
              where,
              include: {
                exam: {
                  select: {
                    id: true,
                    title: true,
                    description: true
                  }
                },
                taker: {
                  select: {
                    id: true,
                    reg: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: { created_at: 'desc' },
              skip: offset,
              take: limit
            }),
            db.exam_results.count({ where })
          ]);
          
          return {
            success: true,
            data: {
              results: results.map(result => ({
                id: result.id,
                exam_id: result.exam_id,
                exam_name: result.exam?.title,
                taker_id: result.taker_id,
                taker_name: result.taker?.name,
                taker_reg: result.taker?.reg,
                score: result.score,
                total_questions: result.total_questions,
                correct_answers: result.correct_answers,
                wrong_answers: result.wrong_answers,
                unanswered: result.unanswered,
                duration: result.duration,
                status: result.status,
                started_at: result.started_at,
                finished_at: result.finished_at,
                created_at: result.created_at
              })),
              pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit)
              }
            }
          };
          
        case 'get':
          if (!arg.exam_id) {
            return {
              success: false,
              message: "exam_id is required"
            };
          }
          
          const result = await db.exam_results.findUnique({
            where: { id: arg.exam_id },
            include: {
              exam: true,
              taker: true,
              exam_answers: {
                include: {
                  question: {
                    include: {
                      question_options: true
                    }
                  }
                }
              }
            }
          });
          
          if (!result) {
            return {
              success: false,
              message: "Result not found"
            };
          }
          
          return {
            success: true,
            data: result
          };
          
        case 'statistics':
          const stats = await db.$queryRaw`
            SELECT 
              COUNT(*) as total_exams,
              AVG(score) as average_score,
              COUNT(CASE WHEN score >= 70 THEN 1 END) as passed_count,
              COUNT(CASE WHEN score < 70 THEN 1 END) as failed_count,
              AVG(duration) as average_duration
            FROM exam_results
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          `;
          
          const todayStats = await db.$queryRaw`
            SELECT 
              COUNT(*) as today_exams,
              COUNT(DISTINCT taker_id) as active_takers
            FROM exam_results
            WHERE DATE(created_at) = CURRENT_DATE
          `;
          
          return {
            success: true,
            data: {
              overall: stats[0],
              today: todayStats[0]
            }
          };
          
        default:
          return {
            success: false,
            message: "Invalid action"
          };
      }
    } catch (error) {
      console.error("Exam results error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan server"
      };
    }
  }
});