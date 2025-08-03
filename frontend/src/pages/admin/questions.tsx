import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ECrud } from "@/components/core/ecrud/ecrud";
import type { CRUDConfig } from "@/components/core/ecrud/ecrud";
import { api } from "@/lib/gen/internal.esensi";

interface Question {
  id: number;
  question: string;
  type: 'multiple_choice' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  explanation?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  question_options?: QuestionOption[];
  question_categories?: QuestionCategory[];
  options?: any[]; // For form input
  categories?: number[]; // For form input
}

interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

interface QuestionCategory {
  id: number;
  question_id: number;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
}

const questionsConfig: CRUDConfig<Question> = {
  entityName: "Soal",
  filters: [],
  columns: [
    {
      key: "question",
      label: "Pertanyaan",
      sortable: true,
      render: (value: any) => (
        <div className="max-w-md">
          <p className="truncate">{value}</p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Tipe",
      sortable: true,
      render: (value: any) => (
        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
          {value === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}
        </span>
      ),
    },
    {
      key: "difficulty",
      label: "Tingkat",
      sortable: true,
      render: (value: any) => (
        <span className={`px-2 py-1 text-xs rounded ${
          value === 'easy' 
            ? 'bg-green-100 text-green-800'
            : value === 'medium'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {value === 'easy' ? 'Mudah' : 
           value === 'medium' ? 'Sedang' : 'Sulit'}
        </span>
      ),
    },
    {
      key: "points",
      label: "Poin",
      sortable: true,
    },
    {
      key: "question_categories",
      label: "Kategori",
      render: (value: any) => (
        <div className="flex flex-wrap gap-1">
          {value?.map((qc: any) => (
            <span key={qc.id} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
              {qc.category?.name}
            </span>
          ))}
        </div>
      ),
    },
  ],
  formFields: [
    {
      name: "question",
      label: "Pertanyaan",
      type: "textarea",
      required: true,
      placeholder: "Masukkan pertanyaan",
    },
    {
      name: "type",
      label: "Tipe Soal",
      type: "select",
      required: true,
      options: [
        { value: "multiple_choice", label: "Pilihan Ganda" },
        { value: "essay", label: "Essay" },
      ],
      defaultValue: "multiple_choice",
    },
    {
      name: "difficulty",
      label: "Tingkat Kesulitan",
      type: "select",
      required: true,
      options: [
        { value: "easy", label: "Mudah" },
        { value: "medium", label: "Sedang" },
        { value: "hard", label: "Sulit" },
      ],
      defaultValue: "medium",
    },
    {
      name: "points",
      label: "Poin",
      type: "number",
      required: true,
      defaultValue: 10,
      placeholder: "Masukkan poin soal",
    },
    {
      name: "explanation",
      label: "Penjelasan Jawaban",
      type: "textarea",
      placeholder: "Penjelasan jawaban yang benar (opsional)",
    },
    // Dynamic fields for multiple choice options would be handled separately
    // Categories would be handled as a relation field
  ],
  softDelete: {
    enabled: false,
    field: "deleted_at",
  },
};

export default function AdminQuestionsPage() {
  const { user, isAuthenticated, isAdmin, initialized } = useAuth();

  // Show loading while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated() || !isAdmin()) {
    navigate("/auth/login?type=internal");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <ECrud<Question>
          config={questionsConfig}
          // apiFunction will be set once API types are generated
          apiFunction={async (args: any) => {
            // Temporary mock until API is ready
            if (args.action === "list") {
              return { success: true, data: [], total: 0 };
            }
            return { success: true, data: {} };
          }}
          onLoadData={async (filters, pagination, sorting) => {
            // Will use api.admin_questions once generated
            try {
              return {
                data: [],
                total: 0,
              };
            } catch (error) {
              console.error("Failed to load questions:", error);
              return { data: [], total: 0 };
            }
          }}
          onEntitySave={async (entity, mode) => {
            // Will handle question options and categories
            return entity;
          }}
          onEntityDelete={async (entity) => {
            // Will use api.admin_questions once generated
          }}
          onEntityRestore={async (entity) => {
            // Will use api.admin_questions once generated
          }}
          // Custom form renderer for handling dynamic options
          customFormRenderer={(props) => {
            // This would handle the dynamic multiple choice options
            // For now, using default form
            return null;
          }}
        />
      </div>
    </div>
  );
}