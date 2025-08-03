import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ECrud } from "@/components/core/ecrud/ecrud";
import type { CRUDConfig } from "@/components/core/ecrud/ecrud";
import { api } from "@/lib/gen/api";

interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  _count?: {
    question_categories: number;
  };
}

const categoriesConfig: CRUDConfig<Category> = {
  entityName: "Kategori",
  primaryKey: "id",
  searchField: "name",
  filterableColumns: ["name"],
  filters: [
    { key: "name", label: "Nama Kategori", type: "text" },
  ],
  columns: [
    {
      key: "name",
      label: "Nama Kategori",
      sortable: true,
    },
    {
      key: "description",
      label: "Deskripsi",
    },
    {
      key: "_count",
      label: "Jumlah Soal",
      render: (value: any) => (
        <span className="text-sm text-gray-600">
          {value?.question_categories || 0} soal
        </span>
      ),
    },
  ],
  formFields: [
    {
      name: "name",
      label: "Nama Kategori",
      type: "text",
      required: true,
      placeholder: "Masukkan nama kategori",
    },
    {
      name: "description",
      label: "Deskripsi",
      type: "textarea",
      placeholder: "Deskripsi kategori (opsional)",
    },
  ],
  softDelete: {
    enabled: true,
    field: "deleted_at",
    method: "null_is_available",
  },
};

export default function AdminCategoriesPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Kategori Soal</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <ECrud<Category>
          config={categoriesConfig}
          // apiFunction will be set once API types are generated
          apiFunction={async (args: any) => {
            // Temporary mock until API is ready
            if (args.action === "list") {
              return { success: true, data: [], total: 0 };
            }
            return { success: true, data: {} };
          }}
          onLoadData={async (filters, pagination, sorting) => {
            // Will use api.admin_categories once generated
            try {
              return {
                data: [],
                total: 0,
              };
            } catch (error) {
              console.error("Failed to load categories:", error);
              return { data: [], total: 0 };
            }
          }}
          onEntitySave={async (entity, mode) => {
            // Will use api.admin_categories once generated
            return entity;
          }}
          onEntityDelete={async (entity) => {
            // Will use api.admin_categories once generated
          }}
          onEntityRestore={async (entity) => {
            // Will use api.admin_categories once generated
          }}
        />
      </div>
    </div>
  );
}