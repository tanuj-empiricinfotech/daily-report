import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  draftMessage: string;
}

const initialState: ChatState = {
  draftMessage: '',
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setDraftMessage(state, action: PayloadAction<string>) {
      state.draftMessage = action.payload;
    },

    clearDraftMessage(state) {
      state.draftMessage = '';
    },
  },
});

export const { setDraftMessage, clearDraftMessage } = chatSlice.actions;

export default chatSlice.reducer;
