import { defineClientAPI, clientQuery } from "@/lib/client-api";

export default defineClientAPI({
  name: "exam_list_client",
  url: "/api/exam/list-client",
  options: { requireClient: true },
  async handler(arg: { page?: number; limit?: number }) {
    const client = this.client!;
    const page = arg.page || 1;
    const limit = arg.limit || 10;
    const offset = (page - 1) * limit;
    
    // Get exams for this client only
    const [exams, total] = await Promise.all([
      db.exams.findMany({
        where: { client_id: client.clientId },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" }
      }),
      db.exams.count({
        where: { client_id: client.clientId }
      })
    ]);
    
    return {
      success: true,
      data: {
        items: exams,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
});