/**
 * ECrud Best Practices Examples
 * 
 * This file contains practical examples of ECrud configurations
 * following best practices and common patterns.
 */

import { ECrud } from "../ecrud";
import { useCrud } from "@/lib/crud-hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// Note: Import formatDateIndonesian from your date utils
// import { formatDateIndonesian } from "@/lib/utils/date";
const formatDateIndonesian = (date: Date | string) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long", 
    year: "numeric"
  });
};
import { useMemo, useCallback } from "react";
import type { CRUDConfig, FlexibleEntity } from "../types";

// Mock API for examples - replace with your actual API import
const api = {
  books: {
    create: (entity: any) => Promise.resolve({ success: true, data: entity }),
    update: (id: any, entity: any) => Promise.resolve({ success: true, data: entity }),
    delete: (id: any) => Promise.resolve({ success: true }),
  }
} as any;

// Example 1: Basic CRUD Configuration
interface Book extends FlexibleEntity {
  name: string;
  description?: string;
  status: "draft" | "published" | "archived";
  author_id: string;
  category_id: string;
  published_date?: Date;
  page_count?: number;
  isbn?: string;
  price?: number;
  view_count?: number; // For performance metrics
}

export const basicBookConfig: CRUDConfig<Book> = {
  entityName: "Buku",
  entityNamePlural: "Buku-buku",
  listTitle: ({ showTrash }) => showTrash ? "Buku Terhapus" : "Daftar Buku",
  
  columns: [
    {
      key: "name",
      label: "Judul",
      sortable: true,
      width: "30%",
      render: useMemo(() => ({ value, entity, isSelected }) => (
        <div className={`font-medium ${isSelected ? "text-primary" : ""}`}>
          {value || "Tanpa Judul"}
        </div>
      ), []),
    },
    {
      key: "status",
      label: "Status",
      width: "120px",
      render: useMemo(() => ({ value }) => (
        <Badge variant={
          value === "published" ? "default" :
          value === "draft" ? "secondary" : "outline"
        }>
          {value === "published" ? "Terbit" :
           value === "draft" ? "Draft" : "Arsip"}
        </Badge>
      ), []),
    },
    {
      key: "published_date",
      label: "Tanggal Terbit",
      sortable: true,
      render: useMemo(() => ({ value }) => 
        value ? formatDateIndonesian(value) : "-", []),
    },
    {
      key: "page_count",
      label: "Jumlah Halaman",
      align: "right" as const,
      render: useMemo(() => ({ value }) => 
        value ? `${value.toLocaleString("id-ID")} hal` : "-", []),
    }
  ],
  
  filters: [
    {
      key: "name",
      label: "Judul",
      type: "text",
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Terbit" },
        { value: "archived", label: "Arsip" }
      ],
    },
    {
      key: "author_id",
      label: "Penulis",
      type: "relation",
      relationConfig: {
        type: "model",
        model: "author",
        labelFields: ["name", "email"],
        renderLabel: (author) => `${author.name} (${author.email})`,
        filters: { status: "active" },
        pageSize: 50,
      },
    }
  ],
  
  formFields: [
    // Basic Information Section
    {
      name: "name",
      label: "Judul Buku",
      type: "text",
      required: true,
      width: "2/3",
      section: "basic",
      validation: (value) => {
        if (!value || value.length < 3) {
          return "Judul harus minimal 3 karakter";
        }
        return null;
      },
    },
    {
      name: "description",
      label: "Deskripsi",
      type: "textarea",
      width: "full",
      section: "basic",
      rows: 4,
      maxLength: 1000,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      width: "1/3",
      section: "basic",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Terbit" },
        { value: "archived", label: "Arsip" }
      ],
    },
    
    // Publication Section
    {
      name: "author_id",
      label: "Penulis",
      type: "relation",
      required: true,
      width: "1/2",
      section: "publication",
      relationConfig: {
        type: "model",
        model: "author",
        labelFields: ["name", "email"],
        renderLabel: (author) => author.name,
        filters: { status: "active" },
        enableSearch: true,
      },
    },
    {
      name: "category_id",
      label: "Kategori",
      type: "relation",
      width: "1/2",
      section: "publication",
      relationConfig: {
        type: "model",
        model: "category",
        labelFields: ["name"],
        renderLabel: (category) => category.name,
      },
    },
    {
      name: "published_date",
      label: "Tanggal Terbit",
      type: "date",
      width: "1/2",
      section: "publication",
      hidden: (data) => data.status === "draft",
    },
    {
      name: "isbn",
      label: "ISBN",
      type: "text",
      width: "1/2",
      section: "publication",
      validation: (value) => {
        if (value && !/^\d{13}$/.test(value.replace(/-/g, ""))) {
          return "ISBN harus berformat valid (13 digit)";
        }
        return null;
      },
    },
    
    // Details Section
    {
      name: "page_count",
      label: "Jumlah Halaman",
      type: "number",
      width: "1/2",
      section: "details",
      validation: (value) => {
        if (value && (value < 1 || value > 10000)) {
          return "Jumlah halaman harus antara 1-10000";
        }
        return null;
      },
    },
    {
      name: "price",
      label: "Harga (Rp)",
      type: "number",
      width: "1/2",
      section: "details",
    }
  ],
  
  sections: [
    {
      id: "basic",
      title: "Informasi Dasar",
      description: "Data dasar buku",
      defaultOpen: true,
    },
    {
      id: "publication",
      title: "Publikasi",
      description: "Informasi penerbit dan kategori",
      defaultOpen: true,
    },
    {
      id: "details",
      title: "Detail Tambahan",
      description: "Informasi teknis dan komersial",
      defaultOpen: false,
    }
  ],
  
  actions: {
    list: {
      create: true,
      edit: true,
      delete: true,
      view: true,
      search: true,
      filter: true,
      sort: true,
      pagination: true,
      bulkSelect: true,
      bulkDelete: true,
      viewTrash: true,
      restore: true,
      bulkRestore: true,
    },
    form: {
      save: true,
      cancel: true,
      delete: true,
      prevNextLink: true,
    },
    detail: {
      edit: true,
      delete: true,
      prevNextLink: true,
    }
  },
  
  softDelete: {
    enabled: true,
    field: "deleted_at",
  },
};

// Example 2: Advanced CRUD with Nested Configuration
interface Chapter extends FlexibleEntity {
  title: string;
  content?: string;
  order: number;
  book_id: string;
  word_count?: number;
  status: "draft" | "published";
}

export const chapterConfig: CRUDConfig<Chapter> = {
  entityName: "Chapter",
  entityNamePlural: "Chapter",
  columns: [
    { key: "order", label: "Urutan", width: "80px" },
    { key: "title", label: "Judul", sortable: true },
    { key: "word_count", label: "Jumlah Kata", align: "right" as const },
    {
      key: "status",
      label: "Status",
      render: useMemo(() => ({ value }) => (
        <Badge variant={value === "published" ? "default" : "secondary"}>
          {value === "published" ? "Terbit" : "Draft"}
        </Badge>
      ), []),
    }
  ],
  filters: [
    { key: "title", label: "Judul", type: "text" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Terbit" }
      ],
    }
  ],
  formFields: [
    {
      name: "title",
      label: "Judul Chapter",
      type: "text",
      required: true,
      width: "2/3",
    },
    {
      name: "order",
      label: "Urutan",
      type: "number",
      required: true,
      width: "1/3",
    },
    {
      name: "content",
      label: "Konten",
      type: "textarea",
      rows: 10,
      width: "full",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Terbit" }
      ],
    }
  ],
  actions: {
    list: {
      create: true,
      edit: true,
      delete: true,
      sort: true,
    }
  }
};

export const advancedBookConfig: CRUDConfig<Book> = {
  ...basicBookConfig,
  nested: [
    {
      title: ({ showTrash }) => showTrash ? "Chapter Terhapus" : "Chapter",
      listTitle: ({ showTrash }) => showTrash ? "Daftar Chapter Terhapus" : "Daftar Chapter",
      config: chapterConfig,
      parentField: "id",
      nestedParentField: "book_id",
      model: "chapter",
      position: "tab",
      showInForm: true,
      showInDetail: true,
    }
  ]
};

// Example 3: Usage in Components

export function BasicBooksPage() {
  const crud = useCrud<Book>(api.books, {
    breadcrumbConfig: {
      basePath: [
        { label: "Dashboard", url: "/dashboard" },
        { label: "Penerbit", url: "/publish" }
      ],
      renderNameLabel: async (book) => book.name || "Buku Tanpa Judul",
    }
  });

  return (
    <div className="container mx-auto py-6">
      <ECrud
        config={basicBookConfig}
        urlState={{ baseUrl: "/books" }}
        apiFunction={api.books}
        {...crud}
      />
    </div>
  );
}

export function AdvancedBooksPage() {
  const crud = useCrud<Book>(api.books, {
    breadcrumbConfig: {
      renderNameLabel: async (book) => book.name || "Buku Tanpa Judul",
    }
  });

  return (
    <ECrud
      config={advancedBookConfig}
      urlState={{ baseUrl: "/books" }}
      apiFunction={api.books}
      layout="default" // Explicitly use default layout
      {...crud}
    />
  );
}

// Example 4: Custom List Renderer
export function BooksWithCustomList() {
  const crud = useCrud<Book>(api.books);

  const customListRender = useCallback(({
    entities,
    loading,
    onEntitySelect,
    onEntityCreate,
    onRefresh
  }: any) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Koleksi Buku</h2>
        <div className="flex gap-2">
          <Button onClick={onRefresh} variant="outline">
            Refresh
          </Button>
          <Button onClick={onEntityCreate}>
            Tambah Buku
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map((book: Book) => (
          <Card
            key={book.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onEntitySelect(book)}
          >
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">
                {book.name || "Tanpa Judul"}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {book.description || "Tidak ada deskripsi"}
              </p>
              <div className="flex justify-between items-center">
                <Badge variant={
                  book.status === "published" ? "default" :
                  book.status === "draft" ? "secondary" : "outline"
                }>
                  {book.status === "published" ? "Terbit" :
                   book.status === "draft" ? "Draft" : "Arsip"}
                </Badge>
                {book.page_count && (
                  <span className="text-sm text-gray-500">
                    {book.page_count} halaman
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {entities.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p>Belum ada buku. Tambahkan buku pertama Anda!</p>
        </div>
      )}
    </div>
  ), []);

  return (
    <ECrud
      config={basicBookConfig}
      customListRender={customListRender}
      {...crud}
    />
  );
}

// Example 5: Side-by-Side Layout (explicitly configured)
export function BooksWithSideBySide() {
  const crud = useCrud<Book>(api.books);

  return (
    <ECrud
      config={basicBookConfig}
      layout="side-by-side"
      sideWidth={{ left: "40%", right: "60%" }}
      emptySelectionMessage="Pilih buku dari daftar untuk melihat detailnya"
      {...crud}
    />
  );
}

// Example 6: Performance Optimized Configuration
export const performanceOptimizedConfig: CRUDConfig<Book> = {
  ...basicBookConfig,
  
  // Memoized column renders for performance
  columns: [
    {
      key: "name",
      label: "Judul",
      sortable: true,
      render: useMemo(() => ({ value, isSelected }) => (
        <span className={isSelected ? "font-semibold" : ""}>{value}</span>
      ), []),
    },
    {
      key: "status",
      label: "Status",
      render: useMemo(() => ({ value }) => {
        const statusConfig = {
          published: { label: "Terbit", variant: "default" as const },
          draft: { label: "Draft", variant: "secondary" as const },
          archived: { label: "Arsip", variant: "outline" as const },
        };
        
        const config = statusConfig[value as keyof typeof statusConfig];
        return config ? (
          <Badge variant={config.variant}>{config.label}</Badge>
        ) : (
          <span>{value}</span>
        );
      }, []),
    }
  ],
  
  // Optimized form fields with sections
  formFields: ({ showTrash, formMode, selectedEntity }) => {
    const fields = [...basicBookConfig.formFields as any[]];
    
    // Conditionally add fields based on context
    if (formMode === "edit" && selectedEntity?.status === "published") {
      fields.push({
        name: "published_metrics",
        label: "Metrik Publikasi",
        type: "readonly",
        value: `Dilihat: ${selectedEntity.view_count || 0} kali`,
        section: "metrics",
      });
    }
    
    return fields;
  },
};

// Example 7: Error Handling Best Practices
export function BooksWithErrorHandling() {
  const crud = useCrud<Book>(api.books, {
    breadcrumbConfig: {
      renderNameLabel: async (book) => book.name || "Buku Tanpa Judul",
    }
  });

  const handleSaveError = useCallback(async (entity: Book, mode: "create" | "edit") => {
    try {
      if (mode === "create") {
        return await api.books.create(entity);
      } else {
        return await api.books.update(entity.id, entity);
      }
    } catch (error: any) {
      if (error.status === 409) {
        throw new Error("Buku dengan judul yang sama sudah ada");
      } else if (error.status === 422) {
        throw new Error("Data tidak valid. Periksa kembali form Anda");
      }
      throw new Error("Gagal menyimpan buku. Silakan coba lagi");
    }
  }, []);

  return (
    <ECrud
      config={basicBookConfig}
      {...crud}
      onEntitySave={handleSaveError}
    />
  );
}

// Export all examples for reference
export const ECrudExamples = {
  BasicBooksPage,
  AdvancedBooksPage,
  BooksWithCustomList,
  BooksWithSideBySide,
  BooksWithErrorHandling,
  configs: {
    basicBookConfig,
    chapterConfig,
    advancedBookConfig,
    performanceOptimizedConfig,
  }
};