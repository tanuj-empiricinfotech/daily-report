import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import {
  setFormDate,
  setFormRows,
  updateFormRow,
  addFormRow,
  removeFormRow,
  setSelectedUserId,
  resetProjectSelections,
  clearForm,
  type LogRow,
} from '@/store/slices/logFormSlice';
import type { DailyLog } from '@/lib/api/types';
import { formatDate } from '@/utils/formatting';

interface UseLogFormPersistenceOptions {
  isEditMode: boolean;
  initialData?: DailyLog[];
}

interface UseLogFormPersistenceReturn {
  date: string;
  setDate: (date: string) => void;
  rows: LogRow[];
  setRows: (rows: LogRow[]) => void;
  updateRow: (id: string, updates: Partial<LogRow>) => void;
  addRow: () => void;
  removeRow: (id: string) => void;
  selectedUserId: number | null;
  setSelectedUser: (userId: number | null) => void;
  resetProjects: () => void;
  clearFormState: () => void;
  isDirty: boolean;
}

const createEmptyRow = (copyProjectFrom?: LogRow): LogRow => ({
  id: Date.now().toString(),
  projectId: copyProjectFrom?.projectId || '',
  taskDescription: '',
  actualTimeSpent: '0:00',
  trackedTime: '0:00',
});

const mapInitialDataToRows = (initialData: DailyLog[]): LogRow[] => {
  return initialData.map((log, index) => ({
    id: `log-${log.id}-${index}`,
    projectId: log.project_id,
    taskDescription: log.task_description,
    actualTimeSpent: log.actual_time_spent || '0:00',
    trackedTime: log.tracked_time || '0:00',
    logId: log.id,
  }));
};

/**
 * Custom hook for managing log form state with persistence.
 *
 * In create mode: Uses Redux state with localStorage persistence
 * In edit mode: Uses local React state (no persistence for edits)
 */
export function useLogFormPersistence({
  isEditMode,
  initialData,
}: UseLogFormPersistenceOptions): UseLogFormPersistenceReturn {
  const dispatch = useDispatch();

  // Redux state (used in create mode)
  const reduxState = useSelector((state: RootState) => state.logForm);

  // Local state (used in edit mode)
  const [localDate, setLocalDate] = React.useState<string>(() => {
    if (initialData && initialData.length > 0) {
      return formatDate(initialData[0].date);
    }
    return formatDate(new Date());
  });

  const [localRows, setLocalRows] = React.useState<LogRow[]>(() => {
    if (initialData && initialData.length > 0) {
      return mapInitialDataToRows(initialData);
    }
    return [createEmptyRow()];
  });

  const [localSelectedUserId, setLocalSelectedUserId] = React.useState<number | null>(null);
  const [localIsDirty, setLocalIsDirty] = React.useState(false);

  // Sync local state when initialData changes (for edit mode)
  React.useEffect(() => {
    if (isEditMode && initialData && initialData.length > 0) {
      setLocalDate(formatDate(initialData[0].date));
      setLocalRows(mapInitialDataToRows(initialData));
    }
  }, [isEditMode, initialData]);

  // Create mode handlers (Redux)
  const reduxHandlers = React.useMemo(() => ({
    setDate: (date: string) => dispatch(setFormDate(date)),
    setRows: (rows: LogRow[]) => dispatch(setFormRows(rows)),
    updateRow: (id: string, updates: Partial<LogRow>) =>
      dispatch(updateFormRow({ id, updates })),
    addRow: () => {
      const lastRow = reduxState.rows[reduxState.rows.length - 1];
      dispatch(addFormRow(createEmptyRow(lastRow)));
    },
    removeRow: (id: string) => dispatch(removeFormRow(id)),
    setSelectedUser: (userId: number | null) => dispatch(setSelectedUserId(userId)),
    resetProjects: () => dispatch(resetProjectSelections()),
    clearFormState: () => dispatch(clearForm()),
  }), [dispatch, reduxState.rows]);

  // Edit mode handlers (local state)
  const localHandlers = React.useMemo(() => ({
    setDate: (date: string) => {
      setLocalDate(date);
      setLocalIsDirty(true);
    },
    setRows: (rows: LogRow[]) => {
      setLocalRows(rows);
      setLocalIsDirty(true);
    },
    updateRow: (id: string, updates: Partial<LogRow>) => {
      setLocalRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...updates } : row))
      );
      setLocalIsDirty(true);
    },
    addRow: () => {
      setLocalRows((prev) => {
        const lastRow = prev[prev.length - 1];
        return [...prev, createEmptyRow(lastRow)];
      });
      setLocalIsDirty(true);
    },
    removeRow: (id: string) => {
      setLocalRows((prev) => {
        if (prev.length > 1) {
          return prev.filter((row) => row.id !== id);
        }
        return prev;
      });
      setLocalIsDirty(true);
    },
    setSelectedUser: (userId: number | null) => {
      setLocalSelectedUserId(userId);
      setLocalIsDirty(true);
    },
    resetProjects: () => {
      setLocalRows((prev) => prev.map((row) => ({ ...row, projectId: '' })));
      setLocalIsDirty(true);
    },
    clearFormState: () => {
      setLocalDate(formatDate(new Date()));
      setLocalRows([createEmptyRow()]);
      setLocalSelectedUserId(null);
      setLocalIsDirty(false);
    },
  }), []);

  // Return appropriate state and handlers based on mode
  if (isEditMode) {
    return {
      date: localDate,
      rows: localRows,
      selectedUserId: localSelectedUserId,
      isDirty: localIsDirty,
      ...localHandlers,
    };
  }

  return {
    date: reduxState.date,
    rows: reduxState.rows,
    selectedUserId: reduxState.selectedUserId,
    isDirty: reduxState.isDirty,
    ...reduxHandlers,
  };
}
