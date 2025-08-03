import type { CRUDConfig } from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { useCrud } from "@/lib/crud-hook";
// @ts-ignore - Generated file
import { api } from "@/lib/gen/api";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Calendar, Clock, Users, FileText } from "lucide-react";
import { AdminGuard } from "@/components/app/auth-guard";
import type { DeliveryWithRelations, DeliveryStatus } from "shared/types";

const getDeliveryStatus = (delivery: DeliveryWithRelations): DeliveryStatus => {
  const now = new Date();
  const scheduledAt = delivery.scheduled_at ? new Date(delivery.scheduled_at) : null;
  const endedAt = delivery.ended_at ? new Date(delivery.ended_at) : null;
  
  if (delivery.is_finished) return "completed" as DeliveryStatus;
  if (endedAt && endedAt < now) return "completed" as DeliveryStatus;
  if (scheduledAt && scheduledAt > now) return "scheduled" as DeliveryStatus;
  return "in_progress" as DeliveryStatus;
};

const getStatusBadge = (delivery: DeliveryWithRelations) => {
  const status = getDeliveryStatus(delivery);
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary">Terjadwal</Badge>;
    case "in_progress":
      return <Badge variant="default">Berlangsung</Badge>;
    case "completed":
      return <Badge variant="outline">Selesai</Badge>;
    default:
      return null;
  }
};

const deliveryCRUDConfig: CRUDConfig<DeliveryWithRelations> = {
  entityName: "Delivery",
  entityNamePlural: "Delivery",
  columns: [
    { 
      key: "name", 
      label: "Nama", 
      sortable: true,
      render: ({ entity }) => entity.name || entity.display_name || `Delivery #${entity.id}`
    },
    { 
      key: "exam", 
      label: "Ujian",
      render: ({ entity }) => entity.exam?.name
    },
    { 
      key: "group", 
      label: "Grup",
      render: ({ entity }) => entity.group?.name
    },
    { 
      key: "scheduled_at", 
      label: "Jadwal", 
      sortable: true,
      render: ({ value }) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDateTime(value)}
        </div>
      )
    },
    { 
      key: "duration", 
      label: "Durasi",
      render: ({ value }) => (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {value} menit
        </div>
      )
    },
    { 
      key: "is_finished", 
      label: "Status",
      render: ({ entity }) => getStatusBadge(entity)
    },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "scheduled", label: "Terjadwal" },
        { value: "in_progress", label: "Berlangsung" },
        { value: "completed", label: "Selesai" },
      ],
    },
  ],
  formFields: [
    {
      name: "exam_id",
      label: "Ujian",
      type: "relation",
      required: true,
      width: "1/2",
      relationConfig: {
        type: "api",
        endpoint: "exam",
        labelFields: ["name"],
        valueField: "id",
        searchField: "name",
      },
    },
    {
      name: "group_id",
      label: "Grup",
      type: "relation",
      required: true,
      width: "1/2",
      relationConfig: {
        type: "api",
        endpoint: "delivery_group",
        labelFields: ["name"],
        valueField: "id",
        searchField: "name",
      },
    },
    {
      name: "name",
      label: "Nama Delivery",
      type: "text",
      width: "full",
      placeholder: "Akan di-generate otomatis dari ujian dan grup",
    },
    {
      name: "display_name",
      label: "Nama Tampilan",
      type: "text",
      width: "full",
      placeholder: "Nama yang ditampilkan ke peserta",
    },
    {
      name: "is_anytime",
      label: "Mode Kapan Saja",
      type: "checkbox",
      width: "1/3",
      description: "Peserta dapat memulai ujian kapan saja",
    },
    {
      name: "scheduled_at",
      label: "Jadwal Mulai",
      type: "datetime-local",
      width: "1/2",
      disabled: (form) => form.is_anytime === true,
    },
    {
      name: "duration",
      label: "Durasi (menit)",
      type: "number",
      required: true,
      width: "1/2",
      defaultValue: 120,
    },
    {
      name: "automatic_start",
      label: "Mulai Otomatis",
      type: "checkbox",
      width: "1/3",
      description: "Ujian dimulai otomatis saat jadwal tiba",
      defaultValue: true,
      disabled: (form) => form.is_anytime === true,
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

export default function DeliveryListPage() {
  const crud = useCrud<DeliveryWithRelations>(api._.delivery, {
    primaryKey: "id",
    breadcrumbConfig: {
      entityNameField: "name",
    },
  });

  return (
    <AdminGuard>
      <main className="flex-1 flex p-4">
        <ECrud
          config={deliveryCRUDConfig}
          urlState={{ baseUrl: "/admin/delivery" }}
          apiFunction={api._.delivery}
          {...crud}
          layout="side-by-side"
        />
      </main>
    </AdminGuard>
  );
}