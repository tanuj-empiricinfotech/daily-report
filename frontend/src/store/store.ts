import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import teamsReducer from './slices/teamsSlice';
import projectsReducer from './slices/projectsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    teams: teamsReducer,
    projects: projectsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

