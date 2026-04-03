import { useState, useEffect, useCallback } from 'react';
import { getColumnVisibility, saveColumnVisibility } from '@/lib/storage.service';

export type ColumnId = 'date' | 'user' | 'project' | 'task' | 'actualTime' | 'trackedTime' | 'actions';

interface UseColumnVisibilityOptions {
  defaultVisibleColumns: ColumnId[];
}

interface UseColumnVisibilityReturn {
  visibleColumns: Set<ColumnId>;
  toggleColumn: (columnId: ColumnId) => void;
  isColumnVisible: (columnId: ColumnId) => boolean;
}

/**
 * Custom hook for managing column visibility state with localStorage persistence
 */
export function useColumnVisibility(
  options: UseColumnVisibilityOptions
): UseColumnVisibilityReturn {
  const { defaultVisibleColumns } = options;

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    const stored = getColumnVisibility() as ColumnId[] | null;
    if (stored) {
      const validColumns = stored.filter((col) =>
        defaultVisibleColumns.includes(col)
      );
      if (validColumns.length > 0) {
        return new Set(validColumns);
      }
    }
    return new Set(defaultVisibleColumns);
  });

  useEffect(() => {
    saveColumnVisibility(Array.from(visibleColumns));
  }, [visibleColumns]);

  const toggleColumn = useCallback((columnId: ColumnId) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  const isColumnVisible = useCallback(
    (columnId: ColumnId): boolean => {
      return visibleColumns.has(columnId);
    },
    [visibleColumns]
  );

  return {
    visibleColumns,
    toggleColumn,
    isColumnVisible,
  };
}
