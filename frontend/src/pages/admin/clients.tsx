import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { ECrud } from "@/components/core/ecrud/ecrud";
import type { CRUDConfig, BreadcrumbItem } from "@/components/core/ecrud/ecrud";
import { api } from "@/lib/api";

interface Client {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  settings?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

const clientsConfig: CRUDConfig<Client> = {
  entityName: "Client",
  filters: [
    {
      key: "is_active",
      label: "Status",
      type: "select",
      options: [
        { value: "true", label: "Aktif" },
        { value: "false", label: "Tidak Aktif" },
      ],
    },
  ],
  columns: [
    {
      key: "name",
      label: "Nama Client",
      sortable: true,
      render: ({ value, entity }: { value: any; entity: Client }) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{entity.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "domain",
      label: "Domain",
      sortable: true,
      render: ({ value }: { value: any }) => (
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || "Tidak ada"}
        </span>
      ),
    },
    {
      key: "subdomain", 
      label: "Subdomain",
      render: ({ value }: { value: any }) => (
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || "Tidak ada"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: ({ value }: { value: any }) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value 
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}>
          {value ? "Aktif" : "Tidak Aktif"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Dibuat",
      sortable: true,
      render: ({ value }: { value: any }) => (
        value ? new Date(value).toLocaleDateString("id-ID") : "-"
      ),
    },
  ],
  formFields: [
    {
      name: "name",
      label: "Nama Client",
      type: "text",
      required: true,
      placeholder: "Masukkan nama client"
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      placeholder: "client-slug (otomatis dari nama jika kosong)",
    },
    {
      name: "domain",
      label: "Domain",
      type: "text",
      placeholder: "example.com"
    },
    {
      name: "subdomain",
      label: "Subdomain",
      type: "text",
      placeholder: "client"
    },
    {
      name: "is_active",
      label: "Status",
      type: "checkbox",
      defaultValue: true
    }
  ],
  softDelete: { 
    enabled: true, 
    field: "deleted_at"
  }
};

export default function ClientsPage() {
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

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Admin" },
    { label: "Manajemen Client" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                Manajemen Client
              </h1>
              <p className="text-sm text-gray-600">Kelola client dan pengaturan mereka</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <ECrud
          config={clientsConfig}
          breadcrumbs={breadcrumbs}
          apiFunction={api.clients}
          onLoadData={async (filters, pagination, sorting) => {
            return await api.clients({
              action: "list",
              ...filters,
              page: pagination?.page || 1,
              limit: pagination?.pageSize || 25,
              sort: sorting?.field?.toString(),
              order: sorting?.direction,
            });
          }}
          onEntitySave={async (entity, mode) => {
            if (mode === "create") {
              return await api.clients({
                action: "create",
                ...entity,
              });
            } else {
              return await api.clients({
                action: "update",
                ...entity,
              });
            }
          }}
          onEntityDelete={async (entity) => {
            return await api.clients({
              action: "delete",
              id: entity.id,
            });
          }}
          onEntityRestore={async (entity) => {
            return await api.clients({
              action: "restore",
              id: entity.id,
            });
          }}
          layout="side-by-side"
          emptySelectionMessage="Pilih client dari daftar untuk melihat atau mengedit"
        />
      </div>
    </div>
  );
}