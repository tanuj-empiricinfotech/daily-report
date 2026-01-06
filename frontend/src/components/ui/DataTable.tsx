/**
 * DataTable Component
 * Generic, reusable data table with sorting, pagination, and row selection
 * Follows clean code principles - single responsibility, DRY, type-safe
 */

import { useMemo, useState, type ReactNode } from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronLeft,
  IconChevronRight,
  IconSelector,
} from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Type definitions following clean code principle of explicit types
export interface Column<TData> {
  /** Unique column identifier */
  id: string;
  /** Column header text */
  header: string;
  /** Accessor function to get cell value from row data */
  accessorFn?: (row: TData) => any;
  /** Custom cell renderer */
  cell?: (row: TData) => ReactNode;
  /** Enable sorting for this column */
  enableSorting?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<TData> {
  /** Table data */
  data: TData[];
  /** Column definitions */
  columns: Column<TData>[];
  /** Enable pagination */
  enablePagination?: boolean;
  /** Rows per page (default: 10) */
  pageSize?: number;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional className */
  className?: string;
  /** Custom row key accessor */
  getRowId?: (row: TData) => string | number;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Get default cell value using accessor or id
 */
function getCellValue<TData>(row: TData, column: Column<TData>): any {
  if (column.accessorFn) {
    return column.accessorFn(row);
  }
  return (row as any)[column.id];
}

/**
 * Compare function for sorting
 */
function compareValues(a: any, b: any, direction: 'asc' | 'desc'): number {
  // Handle null/undefined
  if (a == null && b == null) return 0;
  if (a == null) return direction === 'asc' ? 1 : -1;
  if (b == null) return direction === 'asc' ? -1 : 1;

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }

  // Handle strings and dates
  const aStr = String(a).toLowerCase();
  const bStr = String(b).toLowerCase();

  if (aStr < bStr) return direction === 'asc' ? -1 : 1;
  if (aStr > bStr) return direction === 'asc' ? 1 : -1;
  return 0;
}

export function DataTable<TData>({
  data,
  columns,
  enablePagination = true,
  pageSize = DEFAULT_PAGE_SIZE,
  loading = false,
  emptyMessage = 'No data available',
  className,
  getRowId,
}: DataTableProps<TData>) {
  // State management
  const [sortState, setSortState] = useState<SortState>({
    columnId: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortState.columnId || !sortState.direction) {
      return data;
    }

    const column = columns.find((col) => col.id === sortState.columnId);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = getCellValue(a, column);
      const bValue = getCellValue(b, column);
      return compareValues(aValue, bValue, sortState.direction!);
    });
  }, [data, sortState, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;

    const start = currentPage * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, rowsPerPage, enablePagination]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const canPreviousPage = currentPage > 0;
  const canNextPage = currentPage < totalPages - 1;

  // Handlers
  const handleSort = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column || column.enableSorting === false) return;

    setSortState((prev) => {
      if (prev.columnId !== columnId) {
        return { columnId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { columnId, direction: 'desc' };
      }
      return { columnId: null, direction: null };
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(0, Math.min(newPage, totalPages - 1)));
  };

  const handlePageSizeChange = (newSize: number) => {
    setRowsPerPage(newSize);
    setCurrentPage(0);
  };

  // Render helpers
  const renderSortIcon = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column || column.enableSorting === false) return null;

    if (sortState.columnId !== columnId) {
      return <IconSelector className="ml-2 h-4 w-4 text-muted-foreground" />;
    }

    return sortState.direction === 'asc' ? (
      <IconChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <IconChevronDown className="ml-2 h-4 w-4" />
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('rounded-md border', className)}>
        <div className="p-8 text-center text-muted-foreground">
          <div className="shimmer h-64 rounded" />
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('rounded-md border', className)}>
        <div className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  style={{ width: column.width }}
                  className={cn(
                    column.enableSorting !== false && 'cursor-pointer select-none',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  onClick={() => handleSort(column.id)}
                >
                  <div
                    className={cn(
                      'flex items-center',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    {column.header}
                    {renderSortIcon(column.id)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => {
              const rowKey = getRowId
                ? getRowId(row)
                : `row-${currentPage}-${rowIndex}`;

              return (
                <TableRow key={rowKey}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.cell
                        ? column.cell(row)
                        : getCellValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border bg-background px-2"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <div className="text-sm text-muted-foreground mr-4">
              Page {currentPage + 1} of {totalPages} ({sortedData.length} total)
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(0)}
              disabled={!canPreviousPage}
              aria-label="First page"
            >
              <IconChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!canPreviousPage}
              aria-label="Previous page"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!canNextPage}
              aria-label="Next page"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={!canNextPage}
              aria-label="Last page"
            >
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
