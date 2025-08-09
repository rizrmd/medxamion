import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import type { FlexibleEntity } from "../types";

// Debounce hook for search and filter inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoization hook for expensive column renders
export function useMemoizedColumnRender<T extends FlexibleEntity>(
  renderFunction: (args: { value: any; entity: T; isSelected?: boolean }) => React.ReactNode,
  dependencies: any[] = []
) {
  return useMemo(() => renderFunction, dependencies);
}

// Virtual scrolling hook for large datasets
export function useVirtualScrolling<T extends FlexibleEntity>({
  items,
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5,
}: {
  items: T[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

// Intersection Observer hook for infinite scrolling
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 0.1, rootMargin = "0px", enabled = true } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  const setTarget = useCallback((element: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    targetRef.current = element;

    if (element && enabled) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            callback();
          }
        },
        { threshold, rootMargin }
      );
      observerRef.current.observe(element);
    }
  }, [callback, threshold, rootMargin, enabled]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return setTarget;
}

// Performance monitoring hook
export function useECrudPerformanceMonitor(entityName: string) {
  const metricsRef = useRef({
    renderCount: 0,
    lastRenderTime: 0,
    apiCallCount: 0,
    lastApiCall: 0,
  });

  const startRender = useCallback(() => {
    metricsRef.current.renderCount++;
    metricsRef.current.lastRenderTime = performance.now();
  }, []);

  const endRender = useCallback(() => {
    const renderDuration = performance.now() - metricsRef.current.lastRenderTime;
    
    if (process.env.NODE_ENV === "development" && renderDuration > 100) {
      console.warn(
        `ECrud ${entityName} slow render: ${renderDuration.toFixed(2)}ms`
      );
    }
  }, [entityName]);

  const trackApiCall = useCallback(() => {
    metricsRef.current.apiCallCount++;
    metricsRef.current.lastApiCall = performance.now();
  }, []);

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  return {
    startRender,
    endRender,
    trackApiCall,
    getMetrics,
  };
}

// Optimized entity comparison
export function useEntityComparison<T extends FlexibleEntity>() {
  const entityHashCache = useRef<Map<string | number, string>>(new Map());

  const createEntityHash = useCallback((entity: T): string => {
    return `${entity.id}-${entity.updatedAt?.getTime() || entity.createdAt?.getTime() || 0}`;
  }, []);

  const hasEntityChanged = useCallback((entity: T): boolean => {
    const currentHash = createEntityHash(entity);
    const cachedHash = entityHashCache.current.get(entity.id);
    
    if (cachedHash !== currentHash) {
      entityHashCache.current.set(entity.id, currentHash);
      return true;
    }
    
    return false;
  }, [createEntityHash]);

  const clearCache = useCallback(() => {
    entityHashCache.current.clear();
  }, []);

  return {
    hasEntityChanged,
    clearCache,
  };
}

// Batch update hook for form fields
export function useBatchFormUpdates<T extends Record<string, any>>(
  initialValue: T,
  onBatchUpdate?: (updates: Partial<T>) => void,
  batchDelay = 100
) {
  const [formData, setFormData] = useState<T>(initialValue);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<T>>({});

  const updateField = useCallback((field: keyof T, value: any) => {
    pendingUpdatesRef.current[field] = value;
    
    setFormData(prev => ({ ...prev, [field]: value }));

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      if (onBatchUpdate && Object.keys(pendingUpdatesRef.current).length > 0) {
        onBatchUpdate(pendingUpdatesRef.current);
        pendingUpdatesRef.current = {};
      }
    }, batchDelay);
  }, [onBatchUpdate, batchDelay]);

  const batchUpdate = useCallback((updates: Partial<T>) => {
    Object.assign(pendingUpdatesRef.current, updates);
    setFormData(prev => ({ ...prev, ...updates }));

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      if (onBatchUpdate && Object.keys(pendingUpdatesRef.current).length > 0) {
        onBatchUpdate(pendingUpdatesRef.current);
        pendingUpdatesRef.current = {};
      }
    }, batchDelay);
  }, [onBatchUpdate, batchDelay]);

  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    formData,
    updateField,
    batchUpdate,
    setFormData,
  };
}