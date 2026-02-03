import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { formatDate } from '@/utils/formatting';

export interface LogRow {
  id: string;
  projectId: number | '';
  taskDescription: string;
  actualTimeSpent: string;
  trackedTime: string;
}

interface LogFormState {
  date: string;
  rows: LogRow[];
  selectedUserId: number | null;
  isDirty: boolean;
}

const createEmptyRow = (): LogRow => ({
  id: Date.now().toString(),
  projectId: '',
  taskDescription: '',
  actualTimeSpent: '0:00',
  trackedTime: '0:00',
});

const getInitialState = (): LogFormState => ({
  date: formatDate(new Date()),
  rows: [createEmptyRow()],
  selectedUserId: null,
  isDirty: false,
});

const logFormSlice = createSlice({
  name: 'logForm',
  initialState: getInitialState(),
  reducers: {
    setFormDate(state, action: PayloadAction<string>) {
      state.date = action.payload;
      state.isDirty = true;
    },

    setFormRows(state, action: PayloadAction<LogRow[]>) {
      state.rows = action.payload;
      state.isDirty = true;
    },

    updateFormRow(
      state,
      action: PayloadAction<{ id: string; updates: Partial<LogRow> }>
    ) {
      const { id, updates } = action.payload;
      const rowIndex = state.rows.findIndex((row) => row.id === id);
      if (rowIndex !== -1) {
        state.rows[rowIndex] = { ...state.rows[rowIndex], ...updates };
        state.isDirty = true;
      }
    },

    addFormRow(state, action: PayloadAction<LogRow>) {
      state.rows.push(action.payload);
      state.isDirty = true;
    },

    removeFormRow(state, action: PayloadAction<string>) {
      if (state.rows.length > 1) {
        state.rows = state.rows.filter((row) => row.id !== action.payload);
        state.isDirty = true;
      }
    },

    setSelectedUserId(state, action: PayloadAction<number | null>) {
      state.selectedUserId = action.payload;
      state.isDirty = true;
    },

    resetProjectSelections(state) {
      state.rows = state.rows.map((row) => ({ ...row, projectId: '' }));
      state.isDirty = true;
    },

    clearForm(state) {
      const initial = getInitialState();
      state.date = initial.date;
      state.rows = initial.rows;
      state.selectedUserId = initial.selectedUserId;
      state.isDirty = false;
    },

    setFormDirty(state, action: PayloadAction<boolean>) {
      state.isDirty = action.payload;
    },
  },
});

export const {
  setFormDate,
  setFormRows,
  updateFormRow,
  addFormRow,
  removeFormRow,
  setSelectedUserId,
  resetProjectSelections,
  clearForm,
  setFormDirty,
} = logFormSlice.actions;

export default logFormSlice.reducer;
