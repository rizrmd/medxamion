import type { JsonValue } from "shared/models/runtime/library";

// API response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
};