import type { CRUDConfig } from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { useCrud } from "@/lib/crud-hook";
import { api } from "@/lib/gen/api";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { navigate } from "@/lib/router";
import { AdminGuard } from "@/components/app/auth-guard";
import type { ExamWithRelations } from "shared/types";

const examCRUDConfig: CRUDConfig<ExamWithRelations> = {
  entityName: "Ujian",
  entityNamePlural: "Ujian",
  columns: [
    { 
      key: "code", 
      label: "Kode", 
      sortable: true 
    },
    { 
      key: "name", 
      label: "Nama Ujian", 
      sortable: true 
    },
    { 
      key: "is_mcq", 
      label: "Tipe",
      render: ({ entity }) => (
        <div className="flex gap-1">
          {entity.is_mcq && <Badge variant="secondary">MCQ</Badge>}
          {entity.is_interview && <Badge variant="secondary">Interview</Badge>}
          {!entity.is_mcq && !entity.is_interview && <Badge variant="secondary">Essay</Badge>}
          {entity.is_random && <Badge variant="outline">Random</Badge>}
        </div>
      )
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
    {
      key: "is_mcq",
      label: "Tipe",
      type: "select",
      options: [
        { value: "true", label: "MCQ" },
        { value: "false", label: "Essay/Interview" },
      ],
    },
  ],
  formFields: [
    {
      name: "code",
      label: "Kode Ujian",
      type: "text",
      required: true,
      width: "1/2",
      placeholder: "EXAM001",
    },
    {
      name: "name",
      label: "Nama Ujian",
      type: "text",
      required: true,
      width: "1/2",
      placeholder: "Ujian Tengah Semester",
    },
    {
      name: "description",
      label: "Deskripsi",
      type: "textarea",
      width: "full",
      placeholder: "Deskripsi ujian...",
    },
    {
      name: "is_mcq",
      label: "Tipe MCQ (Pilihan Ganda)",
      type: "checkbox",
      width: "1/3",
      description: "Ujian berupa pilihan ganda",
    },
    {
      name: "is_interview",
      label: "Tipe Interview",
      type: "checkbox",
      width: "1/3",
      description: "Ujian berupa wawancara",
      // Disable if MCQ is checked
      disabled: (form) => form.is_mcq === true,
    },
    {
      name: "is_random",
      label: "Acak Soal",
      type: "checkbox",
      width: "1/3",
      description: "Urutan soal diacak",
    },
    {
      name: "options",
      label: "Pengaturan Lanjutan (JSON)",
      type: "textarea",
      width: "full",
      placeholder: "Masukkan JSON untuk pengaturan lanjutan"
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

export default function ExamListPage() {
  const crud = useCrud<ExamWithRelations>(api._.exam, {
    primaryKey: "id",
    breadcrumbConfig: {
      entityNameField: "name",
    },
  });

  return (
    <AdminGuard>
      <main className="flex-1 flex p-4">
        <ECrud
          config={examCRUDConfig}
          urlState={{ baseUrl: "/admin/exam" }}
          apiFunction={api._.exam}
          {...crud}
          layout="side-by-side"
        />
      </main>
    </AdminGuard>
  );
}