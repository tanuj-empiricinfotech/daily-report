import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import teamsReducer from './slices/teamsSlice';
import projectsReducer from './slices/projectsSlice';
import logFormReducer from './slices/logFormSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
};

const teamsPersistConfig = {
  key: 'teams',
  storage,
};

const projectsPersistConfig = {
  key: 'projects',
  storage,
};

const logFormPersistConfig = {
  key: 'logForm',
  storage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedTeamsReducer = persistReducer(teamsPersistConfig, teamsReducer);
const persistedProjectsReducer = persistReducer(projectsPersistConfig, projectsReducer);
const persistedLogFormReducer = persistReducer(logFormPersistConfig, logFormReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    teams: persistedTeamsReducer,
    projects: persistedProjectsReducer,
    logForm: persistedLogFormReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

