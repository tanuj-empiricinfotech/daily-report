import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'logs-table-columns';

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
 * Following clean code principles - single responsibility, reusable, type-safe
 */
export function useColumnVisibility(
  options: UseColumnVisibilityOptions
): UseColumnVisibilityReturn {
  const { defaultVisibleColumns } = options;

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnId[];
        // Validate that all stored columns are valid ColumnId values
        const validColumns = parsed.filter((col) =>
          defaultVisibleColumns.includes(col)
        ) as ColumnId[];
        if (validColumns.length > 0) {
          return new Set(validColumns);
        }
      }
    } catch (error) {
      // Handle localStorage errors gracefully - fallback to defaults
      console.warn('Failed to load column visibility from localStorage:', error);
    }
    return new Set(defaultVisibleColumns);
  });

  // Save to localStorage whenever visibleColumns changes
  useEffect(() => {
    try {
      const columnsArray = Array.from(visibleColumns);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnsArray));
    } catch (error) {
      // Handle localStorage errors gracefully
      console.warn('Failed to save column visibility to localStorage:', error);
    }
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
