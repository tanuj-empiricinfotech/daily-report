/**
 * Game Context Implementation
 *
 * Concrete implementation of GameContext interface.
 * Bridges game logic with room infrastructure.
 */

import type { Namespace, Socket } from 'socket.io';
import type { GameContext } from '../interfaces/game-context.interface';
import type { Player, GameSettings, Room } from '../types/common.types';
import type { SocketData } from '../types/events.types';

/**
 * Concrete implementation of GameContext
 */
export class GameContextImpl implements GameContext {
  private _room: Room;
  private _gameState: unknown;
  private _isGameActive: boolean = false;
  private namespace: Namespace;
  private activeTimers: Set<NodeJS.Timeout> = new Set();
  private activeIntervals: Set<NodeJS.Timeout> = new Set();
  private onGameEndCallback: (reason: string) => void;

  constructor(
    room: Room,
    namespace: Namespace,
    onGameEndCallback: (reason: string) => void
  ) {
    this._room = room;
    this.namespace = namespace;
    this.onGameEndCallback = onGameEndCallback;
    this._gameState = null;
  }

  // =========================================================================
  // Room Information
  // =========================================================================

  get room(): Room {
    return this._room;
  }

  get roomCode(): string {
    return this._room.code;
  }

  get teamId(): number {
    return this._room.teamId;
  }

  get settings(): GameSettings {
    return this._room.settings;
  }

  get isGameActive(): boolean {
    return this._isGameActive;
  }

  setGameActive(active: boolean): void {
    this._isGameActive = active;
  }

  // =========================================================================
  // Player Access
  // =========================================================================

  get players(): Map<number, Player> {
    return this._room.players;
  }

  getPlayer(playerId: number): Player | undefined {
    return this._room.players.get(playerId);
  }

  getConnectedPlayerIds(): number[] {
    return Array.from(this._room.players.entries())
      .filter(([_, player]) => player.isConnected)
      .map(([id]) => id);
  }

  getConnectedPlayerCount(): number {
    return Array.from(this._room.players.values()).filter((p) => p.isConnected).length;
  }

  // =========================================================================
  // State Management
  // =========================================================================

  getState<T>(): T {
    return this._gameState as T;
  }

  setState<T>(state: T): void {
    this._gameState = state;
  }

  updateState<T>(partial: Partial<T>): void {
    this._gameState = { ...(this._gameState as object), ...partial };
  }

  // =========================================================================
  // Communication
  // =========================================================================

  broadcast(event: string, data: unknown): void {
    this.namespace.to(this._room.code).emit(event, data);
  }

  broadcastExcept(event: string, data: unknown, excludePlayerIds: number | number[]): void {
    const excludeArray = Array.isArray(excludePlayerIds) ? excludePlayerIds : [excludePlayerIds];
    const excludeSocketIds = new Set<string>();

    for (const playerId of excludeArray) {
      const player = this._room.players.get(playerId);
      if (player) {
        excludeSocketIds.add(player.socketId);
      }
    }

    // Get all sockets in the room
    const roomSockets = this.namespace.adapter.rooms.get(this._room.code);
    if (roomSockets) {
      for (const socketId of roomSockets) {
        if (!excludeSocketIds.has(socketId)) {
          this.namespace.to(socketId).emit(event, data);
        }
      }
    }
  }

  sendToPlayer(playerId: number, event: string, data: unknown): void {
    const player = this._room.players.get(playerId);
    if (player && player.socketId) {
      this.namespace.to(player.socketId).emit(event, data);
    }
  }

  sendToPlayers(playerIds: number[], event: string, data: unknown): void {
    for (const playerId of playerIds) {
      this.sendToPlayer(playerId, event, data);
    }
  }

  // =========================================================================
  // Game Control
  // =========================================================================

  endGame(reason: string): void {
    this._isGameActive = false;
    this.clearAllTimers();
    this.onGameEndCallback(reason);
  }

  scheduleTimeout(callback: () => void, delayMs: number): () => void {
    const timer = setTimeout(() => {
      this.activeTimers.delete(timer);
      callback();
    }, delayMs);

    this.activeTimers.add(timer);

    return () => {
      clearTimeout(timer);
      this.activeTimers.delete(timer);
    };
  }

  scheduleInterval(callback: () => void, intervalMs: number): () => void {
    const interval = setInterval(callback, intervalMs);
    this.activeIntervals.add(interval);

    return () => {
      clearInterval(interval);
      this.activeIntervals.delete(interval);
    };
  }

  private clearAllTimers(): void {
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();

    for (const interval of this.activeIntervals) {
      clearInterval(interval);
    }
    this.activeIntervals.clear();
  }

  // =========================================================================
  // Scoring
  // =========================================================================

  addScore(playerId: number, points: number): void {
    const player = this._room.players.get(playerId);
    if (player) {
      player.score += points;
    }
  }

  setScore(playerId: number, score: number): void {
    const player = this._room.players.get(playerId);
    if (player) {
      player.score = score;
    }
  }

  getScore(playerId: number): number {
    return this._room.players.get(playerId)?.score || 0;
  }

  getScoreBoard(): Array<{ playerId: number; score: number }> {
    return Array.from(this._room.players.entries())
      .map(([playerId, player]) => ({
        playerId,
        score: player.score,
      }))
      .sort((a, b) => b.score - a.score);
  }

  // =========================================================================
  // Cleanup
  // =========================================================================

  destroy(): void {
    this.clearAllTimers();
  }
}
