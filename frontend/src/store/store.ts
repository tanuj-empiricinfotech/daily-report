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
import chatReducer from './slices/chatSlice';
import teamChatReducer from './slices/teamChatSlice';

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

const chatPersistConfig = {
  key: 'chat',
  storage,
};

const teamChatPersistConfig = {
  key: 'teamChat',
  storage,
  whitelist: ['drafts', 'isMuted'], // Only persist drafts and mute preference
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedTeamsReducer = persistReducer(teamsPersistConfig, teamsReducer);
const persistedProjectsReducer = persistReducer(projectsPersistConfig, projectsReducer);
const persistedLogFormReducer = persistReducer(logFormPersistConfig, logFormReducer);
const persistedChatReducer = persistReducer(chatPersistConfig, chatReducer);
const persistedTeamChatReducer = persistReducer(teamChatPersistConfig, teamChatReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    teams: persistedTeamsReducer,
    projects: persistedProjectsReducer,
    logForm: persistedLogFormReducer,
    chat: persistedChatReducer,
    teamChat: persistedTeamChatReducer,
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

