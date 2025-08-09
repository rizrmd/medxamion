import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { css } from "goober";
import { BookMarked, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { proxy, useSnapshot } from "valtio";

// Add CSS to hide scrollbar while maintaining scroll functionality
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .scrollbar-hide {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;  /* Chrome, Safari and Opera */
    }
  `;
  document.head.appendChild(style);
}

export interface BaseEntity {
  id?: string | number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  align?: "left" | "center" | "right";
  render?: (args: { value: any; entity: T; isSelected?: boolean }) => ReactNode;
  className?: string;
  hidden?: boolean;
}

interface ETableState<T> {
  columns: ColumnConfig<T>[];
  scrollbarWidth: number;
  containerWidth: number;
  hasHorizontalScroll: boolean;
}

export const ETable = <T extends BaseEntity>(opt: {
  data: T[];
  columns: ColumnConfig<T>[];
  className?: string;
  loading?: boolean;
  sorting?: {
    field: keyof T | null;
    direction: "asc" | "desc" | null;
  };
  onSort?: (field: keyof T) => void;
  selectedEntity?: T | null;
  bulkSelection?: {
    enabled: boolean;
    selectedIds: (string | number)[];
    onSelectionChange: (selectedIds: (string | number)[]) => void;
    allRecordsSelected?: boolean;
  };
}) => {
  const write = useRef(
    proxy<ETableState<T>>({
      columns: opt.columns,
      scrollbarWidth: 0,
      containerWidth: 0,
      hasHorizontalScroll: false,
    })
  ).current;
  const read = useSnapshot(write);

  // Ref for the scrollable body container
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to check and update scrollbar width and table sizing
  const updateTableSizing = () => {
    if (!tableWrapperRef.current || !bodyContainerRef.current) return;

    // Calculate base scrollbar width
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll";
    outer.style.position = "absolute";
    outer.style.width = "100px";
    outer.style.height = "100px";
    document.body.appendChild(outer);

    const systemScrollbarWidth = outer.offsetWidth - outer.clientWidth;
    document.body.removeChild(outer);

    // Check if there's actually a scrollbar in the body container
    const hasVerticalScrollbar = bodyContainerRef.current.scrollHeight > bodyContainerRef.current.clientHeight;
    const actualScrollbarWidth = hasVerticalScrollbar ? systemScrollbarWidth : 0;

    // Calculate minimum table width based on column configurations
    const minTableWidth = read.columns.reduce((acc, col) => {
      if (col.width) {
        const width = typeof col.width === "number" ? col.width : parseInt(col.width) || 0;
        return acc + width;
      }
      const minWidth = col.minWidth 
        ? (typeof col.minWidth === "number" ? col.minWidth : parseInt(col.minWidth) || 150)
        : 150;
      return acc + minWidth;
    }, opt.bulkSelection?.enabled ? 50 : 0);

    // Get container width
    const containerWidth = tableWrapperRef.current.clientWidth;
    const availableWidth = containerWidth - actualScrollbarWidth;
    
    // Determine if horizontal scroll is needed
    const hasHorizontalScroll = minTableWidth > availableWidth;

    // Update state
    write.scrollbarWidth = actualScrollbarWidth;
    write.containerWidth = containerWidth;
    write.hasHorizontalScroll = hasHorizontalScroll;
  };

  // Update table sizing when data changes
  useEffect(() => {
    // Use a small timeout to ensure DOM has been updated after data change
    const timeoutId = setTimeout(updateTableSizing, 10);
    return () => clearTimeout(timeoutId);
  }, [opt.data]);

  // Update table sizing when container size changes
  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    const container = bodyContainerRef.current;
    if (!wrapper || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateTableSizing();
    });

    resizeObserver.observe(wrapper);
    resizeObserver.observe(container);

    // Initial calculation
    updateTableSizing();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Sync horizontal scroll between header and body
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const header = headerRef.current;
    const body = bodyContainerRef.current;
    
    if (!scrollContainer || !header || !body || !read.hasHorizontalScroll) return;
    
    const syncScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      if (target === body) {
        header.scrollLeft = target.scrollLeft;
      }
    };
    
    body.addEventListener('scroll', syncScroll);
    
    return () => {
      body.removeEventListener('scroll', syncScroll);
    };
  }, [read.hasHorizontalScroll]);

  useEffect(() => {
    write.columns = opt.columns;
  }, [opt.columns]);

  const handleSelectAll = (checked: boolean) => {
    if (!opt.bulkSelection) return;

    if (checked) {
      const allIds = opt.data
        .map((item) => item.id)
        .filter((id): id is string | number => id !== undefined);
      opt.bulkSelection.onSelectionChange(allIds);
    } else {
      opt.bulkSelection.onSelectionChange([]);
    }
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    if (!opt.bulkSelection) return;

    let newSelection = [...opt.bulkSelection.selectedIds];
    if (checked) {
      newSelection.push(id);
    } else {
      newSelection = newSelection.filter((selectedId) => selectedId !== id);
    }
    opt.bulkSelection.onSelectionChange(newSelection);
  };

  const selectedLen = opt.bulkSelection?.selectedIds.length || 0;
  const isAllSelected =
    opt.bulkSelection?.allRecordsSelected ||
    (selectedLen === opt.data.length && opt.data.length > 0);
  const isIndeterminate =
    selectedLen > 0 &&
    selectedLen < opt.data.length &&
    !opt.bulkSelection?.allRecordsSelected;

  const totalColumns =
    read.columns.length + (opt.bulkSelection?.enabled ? 1 : 0);

  // Calculate grid template columns
  const getGridTemplateColumns = (includeScrollbar: boolean = false) => {
    const columns: string[] = [];
    
    // Add checkbox column if bulk selection is enabled
    if (opt.bulkSelection?.enabled) {
      columns.push("50px");
    }
    
    // Calculate total fixed width and flexible column count
    let totalFixedWidth = opt.bulkSelection?.enabled ? 50 : 0;
    let flexibleColumnCount = 0;
    
    read.columns.forEach((col) => {
      if (col.width) {
        const width = typeof col.width === "number" ? col.width : parseInt(col.width) || 0;
        totalFixedWidth += width;
      } else {
        flexibleColumnCount++;
      }
    });
    
    // Calculate available width for flexible columns
    const availableWidth = read.containerWidth - totalFixedWidth - (includeScrollbar ? read.scrollbarWidth : 0);
    const flexibleColumnWidth = flexibleColumnCount > 0 ? Math.max(150, availableWidth / flexibleColumnCount) : 0;
    
    // Build column template
    read.columns.forEach((col, idx) => {
      const isLastColumn = idx === read.columns.length - 1;
      
      if (col.width) {
        const width = typeof col.width === "number" ? col.width : parseInt(col.width) || 0;
        if (isLastColumn && includeScrollbar && !read.hasHorizontalScroll) {
          columns.push(`${width + read.scrollbarWidth}px`);
        } else {
          columns.push(typeof col.width === "number" ? `${col.width}px` : col.width);
        }
      } else {
        const minWidth = col.minWidth 
          ? (typeof col.minWidth === "number" ? col.minWidth : parseInt(col.minWidth) || 150)
          : 150;
        
        if (read.hasHorizontalScroll) {
          columns.push(`${minWidth}px`);
        } else if (isLastColumn && includeScrollbar) {
          columns.push(`minmax(${minWidth}px, ${flexibleColumnWidth + read.scrollbarWidth}px)`);
        } else {
          columns.push(`minmax(${minWidth}px, ${flexibleColumnWidth}px)`);
        }
      }
    });
    
    return columns.join(" ");
  };
  
  const rowTemplateColumns = getGridTemplateColumns(false);
  const headTemplateColumns = getGridTemplateColumns(true);

  return (
    <div
      ref={tableWrapperRef}
      className={cn(
        "flex flex-col border rounded-lg h-full overflow-hidden",
        opt.className
      )}
    >
      {read.columns.length > 0 && (
        <div ref={scrollContainerRef} className={cn("flex flex-col h-full relative")}>
          {/* Header wrapper with hidden scrollbar */}
          <div 
            className={cn(
              "flex-shrink-0 bg-background-alt border-b",
              read.hasHorizontalScroll && "overflow-x-hidden"
            )}
          >
            <div
              ref={headerRef}
              className={cn(
                "grid grid-col",
                read.hasHorizontalScroll && "overflow-x-auto scrollbar-hide"
              )}
              style={{ 
                gridTemplateColumns: headTemplateColumns,
                minWidth: read.hasHorizontalScroll ? "max-content" : undefined,
                paddingRight: read.hasHorizontalScroll ? 0 : `${read.scrollbarWidth}px`
              }}
            >
              {opt.bulkSelection?.enabled && (
                <div className="p-2 flex items-center justify-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
                    {...(isIndeterminate && { "data-state": "indeterminate" })}
                  />
                </div>
              )}
              {read.columns.map((col, index) => (
                <div
                  key={col.key as string}
                  className={cn(
                    "p-2 font-semibold select-none text-sm text-left flex items-center",
                    col.align === "center" && "justify-center",
                    col.align === "right" && "justify-end",
                    col.className,
                    col.sortable &&
                      opt.onSort &&
                      "cursor-pointer hover:bg-gray-100"
                  )}
                  onClick={() => {
                    if (col.sortable && opt.onSort) {
                      opt.onSort(col.key as keyof T);
                    }
                  }}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      col.align === "center" && "justify-center",
                      col.align === "right" && "justify-end"
                    )}
                  >
                    <span className="whitespace-nowrap">{col.label}</span>
                    {col.sortable && (
                      <div className="flex items-center">
                        {opt.sorting?.field === col.key &&
                        opt.sorting.direction ? (
                          opt.sorting.direction === "asc" ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <></>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body Container */}
          <div
            ref={bodyContainerRef}
            className={cn(
              "flex-1 overflow-y-auto",
              read.hasHorizontalScroll && "overflow-x-auto"
            )}
          >
            {opt.data.length > 0 ? (
              <div className={read.hasHorizontalScroll ? "min-w-max" : ""}>
                {opt.data.map((row, index) => (
                  <div
                    key={row.id}
                    className={cn(
                      "grid hover:bg-muted/50 transition-colors",
                      index > 0 && "border-t border-gray-200"
                    )}
                    style={{ 
                      gridTemplateColumns: rowTemplateColumns,
                      minWidth: read.hasHorizontalScroll ? "max-content" : undefined
                    }}
                  >
                    {opt.bulkSelection?.enabled && (
                      <div key={`${row.id}-checkbox`} className="p-2 flex items-center justify-center">
                        <Checkbox
                          checked={opt.bulkSelection.selectedIds.includes(
                            row.id as string | number
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectItem(
                              row.id as string | number,
                              checked as boolean
                            )
                          }
                        />
                      </div>
                    )}
                    {read.columns.map((col) => (
                      <div
                        key={`${row.id}-${col.key as string}`}
                        className={cn(
                          "p-2 text-sm flex items-center",
                          col.align === "center" && "justify-center",
                          col.align === "right" && "justify-end",
                          col.className
                        )}
                      >
                        <div className="w-full overflow-hidden">
                          <div className="truncate">
                            {col.render
                              ? col.render({ value: row[col.key as keyof T], entity: row, isSelected: opt.selectedEntity?.id === row.id || (row.id ? opt.bulkSelection?.selectedIds.includes(row.id) : false) })
                              : (row[col.key as keyof T] as ReactNode)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="grid p-4 text-gray-500"
                style={{ 
                  gridTemplateColumns: rowTemplateColumns,
                  minWidth: read.hasHorizontalScroll ? "max-content" : undefined
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ gridColumn: `1 / ${totalColumns + 1}` }}
                >
                  {opt.loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <BookMarked size={16} />
                      Tidak Ditemukan
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};