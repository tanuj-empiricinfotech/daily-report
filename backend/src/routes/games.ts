/**
 * Games REST Routes
 *
 * Endpoints for game-related REST operations (not real-time).
 */

import { Router, Response } from 'express';
import { authenticate, type AuthRequest, getAuthenticatedUser } from '../middleware/auth';
import { gameRegistry } from '../games/core/services/game-registry.service';
import { getRoomManager } from '../games/core/socket/game.socket';
import { query } from '../db/connection';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/games
 * List all available games
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const games = gameRegistry.getAvailableGames();
    res.json({ success: true, data: games });
  } catch (error) {
    logger.error('Failed to get games list', { error });
    res.status(500).json({ success: false, error: 'Failed to get games' });
  }
});

/**
 * GET /api/games/:gameId
 * Get specific game info
 */
router.get('/:gameId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = gameRegistry.get(gameId);

    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    res.json({
      success: true,
      data: {
        id: game.id,
        name: game.name,
        description: game.description,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        defaultSettings: game.defaultSettings,
      },
    });
  } catch (error) {
    logger.error('Failed to get game info', { error, gameId: req.params.gameId });
    res.status(500).json({ success: false, error: 'Failed to get game info' });
  }
});

/**
 * GET /api/games/rooms/active
 * List active rooms for user's team
 */
router.get('/rooms/active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);

    // Get user's team
    const userResult = await query('SELECT team_id FROM users WHERE id = $1', [user.userId]);
    const teamId = userResult.rows[0]?.team_id;

    if (!teamId) {
      return res.json({ success: true, data: [] });
    }

    const roomManager = getRoomManager();
    const rooms = roomManager.getRoomsByTeam(teamId);

    // Map to public room info
    const publicRooms = rooms.map((room) => ({
      code: room.code,
      gameId: room.gameId,
      hostId: room.hostId,
      playerCount: room.players.size,
      maxPlayers: gameRegistry.get(room.gameId)?.maxPlayers || 8,
      status: room.status,
    }));

    res.json({ success: true, data: publicRooms });
  } catch (error) {
    logger.error('Failed to get active rooms', { error });
    res.status(500).json({ success: false, error: 'Failed to get active rooms' });
  }
});

/**
 * GET /api/games/history
 * Get user's game history
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT
        gs.id,
        gs.game_type_id,
        gt.name as game_name,
        gs.room_code,
        gs.started_at,
        gs.ended_at,
        gs.duration_ms,
        gp.final_score,
        gp.final_rank,
        gp.stats,
        (SELECT COUNT(*) FROM game_participants WHERE game_session_id = gs.id) as player_count
      FROM game_sessions gs
      JOIN game_participants gp ON gs.id = gp.game_session_id
      JOIN game_types gt ON gs.game_type_id = gt.id
      WHERE gp.user_id = $1 AND gs.status = 'finished'
      ORDER BY gs.ended_at DESC
      LIMIT $2 OFFSET $3`,
      [user.userId, Number(limit), Number(offset)]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Failed to get game history', { error });
    res.status(500).json({ success: false, error: 'Failed to get game history' });
  }
});

/**
 * GET /api/games/leaderboard
 * Get team leaderboard (all games)
 */
router.get('/leaderboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);

    // Get user's team
    const userResult = await query('SELECT team_id FROM users WHERE id = $1', [user.userId]);
    const teamId = userResult.rows[0]?.team_id;

    if (!teamId) {
      return res.json({ success: true, data: [] });
    }

    const result = await query(
      `SELECT
        user_id,
        user_name,
        SUM(games_played) as games_played,
        SUM(total_score) as total_score,
        SUM(wins) as wins,
        ROUND(AVG(avg_score)::numeric, 1) as avg_score
      FROM team_game_leaderboard
      WHERE team_id = $1
      GROUP BY user_id, user_name
      ORDER BY total_score DESC
      LIMIT 50`,
      [teamId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Failed to get leaderboard', { error });
    res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
});

/**
 * GET /api/games/leaderboard/:gameId
 * Get team leaderboard for specific game
 */
router.get('/leaderboard/:gameId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    const { gameId } = req.params;

    // Get user's team
    const userResult = await query('SELECT team_id FROM users WHERE id = $1', [user.userId]);
    const teamId = userResult.rows[0]?.team_id;

    if (!teamId) {
      return res.json({ success: true, data: [] });
    }

    const result = await query(
      `SELECT
        user_id,
        user_name,
        games_played,
        total_score,
        wins,
        avg_score
      FROM team_game_leaderboard
      WHERE team_id = $1 AND game_type_id = $2
      ORDER BY total_score DESC
      LIMIT 50`,
      [teamId, gameId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Failed to get game leaderboard', { error, gameId: req.params.gameId });
    res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
});

export default router;
