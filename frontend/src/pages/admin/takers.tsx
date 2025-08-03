import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ECrud } from "@/components/core/ecrud/ecrud";
import type { CRUDConfig, BreadcrumbItem } from "@/components/core/ecrud/ecrud";
import { api } from "@/lib/api";

interface Taker {
  id: number;
  reg: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

const takersConfig: CRUDConfig<Taker> = {
  entityName: "Peserta",
  filters: [],
  columns: [
    {
      key: "reg",
      label: "No. Registrasi",
      sortable: true,
    },
    {
      key: "name", 
      label: "Nama",
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "phone",
      label: "No. Telepon",
    },
    {
      key: "status",
      label: "Status",
      render: (value: any) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
  ],
  formFields: [
    {
      name: "reg",
      label: "No. Registrasi",
      type: "text",
      placeholder: "Biarkan kosong untuk generate otomatis",
    },
    {
      name: "name",
      label: "Nama Lengkap",
      type: "text",
      required: true,
      placeholder: "Masukkan nama lengkap",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "email@example.com",
    },
    {
      name: "phone",
      label: "No. Telepon",
      type: "text",
      placeholder: "08123456789",
    },
    {
      name: "address",
      label: "Alamat",
      type: "textarea",
      placeholder: "Alamat lengkap",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Biarkan kosong untuk menggunakan no. registrasi",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Aktif" },
        { value: "inactive", label: "Nonaktif" },
      ],
      defaultValue: "active",
    },
  ],
  softDelete: {
    enabled: false,
    field: "deleted_at",
  },
};

export default function AdminTakersPage() {
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

  // Define breadcrumbs
  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" },
    { label: "Manajemen Peserta" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Peserta</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <ECrud<Taker>
          config={takersConfig}
          breadcrumbs={breadcrumbs}
          apiFunction={async (args: any) => {
            // Temporary mock until API is ready
            if (args.action === "list") {
              return { success: true, data: [], total: 0 };
            }
            return { success: true, data: {} };
          }}
          onLoadData={async (filters, pagination, sorting) => {
            try {
              // TODO: Use real API once types are generated
              // const response = await api.admin_takers({
              //   action: "list",
              //   ...filters,
              //   page: pagination.page,
              //   limit: pagination.pageSize,
              //   ...(sorting.field && {
              //     sort: sorting.field,
              //     order: sorting.direction || "asc",
              //   }),
              // });
              
              // Mock data for now
              return {
                data: [],
                total: 0,
              };
            } catch (error) {
              console.error("Failed to load takers:", error);
              return { data: [], total: 0 };
            }
          }}
          onEntitySave={async (entity, mode) => {
            try {
              // TODO: Use real API once types are generated
              // const action = mode === "create" ? "create" : "update";
              // const response = await api.admin_takers({
              //   action,
              //   ...entity,
              // });
              // return response.data;
              
              // Mock for now
              console.log("Saving entity:", entity, mode);
              return entity;
            } catch (error) {
              console.error("Failed to save taker:", error);
              throw error;
            }
          }}
          onEntityDelete={async (entity) => {
            try {
              // TODO: Use real API once types are generated
              // await api.admin_takers({
              //   action: "delete",
              //   id: entity.id,
              // });
              
              console.log("Deleting entity:", entity);
            } catch (error) {
              console.error("Failed to delete taker:", error);
              throw error;
            }
          }}
        />
      </div>
    </div>
  );
}