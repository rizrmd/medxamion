import { defineClientAPI, clientCreate } from "@/lib/client-api";

export default defineClientAPI({
  name: "exam_create_client", 
  url: "/api/exam/create-client",
  options: { requireClient: true },
  async handler(arg: {
    code: string;
    name: string;
    description?: string;
    options?: any;
    is_mcq?: boolean;
    is_interview?: boolean;
    is_random?: boolean;
  }) {
    const client = this.client!;
    
    // Check if exam code already exists for this client
    const existing = await db.exams.findFirst({
      where: {
        client_id: client.clientId,
        code: arg.code
      }
    });
    
    if (existing) {
      return {
        success: false,
        message: "Kode ujian sudah digunakan"
      };
    }
    
    // Create exam with client context
    const examData = clientCreate(client.clientId, {
      code: arg.code,
      name: arg.name,
      description: arg.description,
      options: arg.options ? JSON.stringify(arg.options) : null,
      is_mcq: arg.is_mcq,
      is_interview: arg.is_interview || false,
      is_random: arg.is_random || false
    });
    
    const exam = await db.exams.create({
      data: examData
    });
    
    return {
      success: true,
      data: exam,
      message: "Ujian berhasil dibuat"
    };
  }
});