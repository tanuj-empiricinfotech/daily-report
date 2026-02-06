/**
 * Game Redux Slice
 *
 * Manages game state in Redux store.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Player,
  GameInfo,
  GameSettings,
  RoomStatus,
  ConnectionStatus,
  GameResult,
} from '../types/game.types';

// =============================================================================
// State Interface
// =============================================================================

export interface GameState {
  // Connection
  connectionStatus: ConnectionStatus;
  connectionError: string | null;

  // Room
  roomCode: string | null;
  gameId: string | null;
  gameInfo: GameInfo | null;
  players: Player[];
  settings: GameSettings;
  hostId: number | null;
  status: RoomStatus;
  isHost: boolean;

  // Game
  isGameActive: boolean;
  gameState: unknown;
  countdown: number | null;

  // Results
  gameResult: GameResult | null;

  // Available games list
  availableGames: GameInfo[];
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: GameState = {
  connectionStatus: 'disconnected',
  connectionError: null,

  roomCode: null,
  gameId: null,
  gameInfo: null,
  players: [],
  settings: {},
  hostId: null,
  status: 'lobby',
  isHost: false,

  isGameActive: false,
  gameState: null,
  countdown: null,

  gameResult: null,

  availableGames: [],
};

// =============================================================================
// Slice
// =============================================================================

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Connection
    setConnectionStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.connectionStatus = action.payload;
      if (action.payload === 'connected') {
        state.connectionError = null;
      }
    },
    setConnectionError(state, action: PayloadAction<string>) {
      state.connectionError = action.payload;
      state.connectionStatus = 'error';
    },

    // Room
    setRoomState(
      state,
      action: PayloadAction<{
        roomCode: string;
        gameInfo: GameInfo;
        players: Player[];
        settings: GameSettings;
        hostId: number;
        isHost: boolean;
      }>
    ) {
      const { roomCode, gameInfo, players, settings, hostId, isHost } = action.payload;
      state.roomCode = roomCode;
      state.gameId = gameInfo.id;
      state.gameInfo = gameInfo;
      state.players = players;
      state.settings = settings;
      state.hostId = hostId;
      state.isHost = isHost;
      state.status = 'lobby';
    },
    clearRoom(state) {
      state.roomCode = null;
      state.gameId = null;
      state.gameInfo = null;
      state.players = [];
      state.settings = {};
      state.hostId = null;
      state.status = 'lobby';
      state.isHost = false;
      state.isGameActive = false;
      state.gameState = null;
      state.gameResult = null;
    },

    // Players
    addPlayer(state, action: PayloadAction<Player>) {
      state.players.push(action.payload);
    },
    removePlayer(state, action: PayloadAction<number>) {
      state.players = state.players.filter((p) => p.id !== action.payload);
    },
    updatePlayer(state, action: PayloadAction<Partial<Player> & { id: number }>) {
      const index = state.players.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.players[index] = { ...state.players[index], ...action.payload };
      }
    },
    setHost(state, action: PayloadAction<number>) {
      state.hostId = action.payload;
      // Update isHost based on current user (will be set from hook)
    },

    // Settings
    setSettings(state, action: PayloadAction<GameSettings>) {
      state.settings = action.payload;
    },
    updateSettings(state, action: PayloadAction<Partial<GameSettings>>) {
      state.settings = { ...state.settings, ...action.payload };
    },

    // Game lifecycle
    setStatus(state, action: PayloadAction<RoomStatus>) {
      state.status = action.payload;
    },
    setCountdown(state, action: PayloadAction<number | null>) {
      state.countdown = action.payload;
    },
    startGame(state) {
      state.isGameActive = true;
      state.status = 'active';
      state.countdown = null;
    },
    setGameState(state, action: PayloadAction<unknown>) {
      state.gameState = action.payload;
    },
    endGame(state, action: PayloadAction<GameResult>) {
      state.isGameActive = false;
      state.status = 'finished';
      state.gameResult = action.payload;
    },

    // Available games
    setAvailableGames(state, action: PayloadAction<GameInfo[]>) {
      state.availableGames = action.payload;
    },

    // Reset
    resetGameState() {
      return initialState;
    },
  },
});

export const {
  setConnectionStatus,
  setConnectionError,
  setRoomState,
  clearRoom,
  addPlayer,
  removePlayer,
  updatePlayer,
  setHost,
  setSettings,
  updateSettings,
  setStatus,
  setCountdown,
  startGame,
  setGameState,
  endGame,
  setAvailableGames,
  resetGameState,
} = gameSlice.actions;

export default gameSlice.reducer;
