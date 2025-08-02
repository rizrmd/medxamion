import type { CRUDConfig } from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { useCrud } from "@/lib/crud-hook";
import { api } from "../../../lib/gen/api";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Users, UserPlus } from "lucide-react";
import { AdminGuard } from "@/components/app/auth-guard";
import type { GroupWithRelations } from "shared/types";

const groupCRUDConfig: CRUDConfig<GroupWithRelations> = {
  entityName: "Grup",
  entityNamePlural: "Grup",
  columns: [
    { 
      key: "code", 
      label: "Kode", 
      sortable: true 
    },
    { 
      key: "name", 
      label: "Nama Grup", 
      sortable: true 
    },
    { 
      key: "description", 
      label: "Deskripsi",
      render: ({ value }) => value || "-"
    },
    { 
      key: "created_at", 
      label: "Dibuat", 
      sortable: true,
      render: ({ value }) => formatDate(value)
    },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    { key: "code", label: "Kode", type: "text" },
  ],
  formFields: [
    {
      name: "code",
      label: "Kode Grup",
      type: "text",
      required: true,
      width: "1/2",
      placeholder: "GRP001",
    },
    {
      name: "name",
      label: "Nama Grup",
      type: "text",
      required: true,
      width: "1/2",
      placeholder: "Grup Ujian Semester",
    },
    {
      name: "description",
      label: "Deskripsi",
      type: "textarea",
      width: "full",
      placeholder: "Deskripsi grup...",
    },
  ],
  actions: {
    list: {
      create: true,
      view: false,
      edit: true,
      delete: true,
      search: true,
      filter: true,
      sort: true,
      pagination: true,
      bulkSelect: true,
      viewTrash: false,
    },
    form: {
      save: true,
      cancel: true,
    },
  },
};

export default function GroupListPage() {
  const crud = useCrud<GroupWithRelations>(api._.delivery_group, {
    primaryKey: "id",
    breadcrumbConfig: {
      entityNameField: "name",
    },
  });

  return (
    <AdminGuard>
      <main className="flex-1 flex p-4">
        <ECrud
          config={groupCRUDConfig}
          urlState={{ baseUrl: "/admin/group" }}
          apiFunction={api._.delivery_group}
          {...crud}
          layout="side-by-side"
        />
      </main>
    </AdminGuard>
  );
}