// ECrud Utilities Export
// This file provides easy access to all ECrud utility functions and hooks

// Error handling
export {
  ECrudErrorBoundary,
  withErrorBoundary,
  useECrudErrorRecovery,
} from "./error-boundary";

// Performance optimization
export {
  useDebounce,
  useMemoizedColumnRender,
  useVirtualScrolling,
  useInfiniteScroll,
  useECrudPerformanceMonitor,
  useEntityComparison,
  useBatchFormUpdates,
} from "./performance";

// Configuration validation
export {
  validateECrudConfig,
  debugECrudConfig,
} from "./config-validator";

// Navigation utilities
export {
  getNavigationInfo,
  createNavigationActions,
} from "./navigation";

// Breadcrumb utilities
export {
  generateSmartBreadcrumbs,
  createBreadcrumbHandlers,
} from "./breadcrumbs";

// Re-export types for convenience
export type {
  NavigationInfo,
  NavigationTarget,
  PaginationState,
  NavigationActions,
} from "./navigation";

export type {
  BreadcrumbItem,
  BreadcrumbState,
} from "../types";