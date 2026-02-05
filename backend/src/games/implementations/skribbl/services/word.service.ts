/**
 * Word Service
 *
 * Manages word selection for Skribbl game.
 * Supports both database-stored words and fallback hardcoded words.
 */

import { query } from '../../../../db/connection';
import type { WordDifficulty } from '../skribbl.config';
import logger from '../../../../utils/logger';

/**
 * Word data structure
 */
interface Word {
  id: number;
  word: string;
  category: string;
  difficulty: WordDifficulty;
}

/**
 * Fallback words if database is not available
 */
const FALLBACK_WORDS: Record<WordDifficulty, string[]> = {
  easy: [
    'cat', 'dog', 'house', 'tree', 'sun', 'moon', 'car', 'book', 'fish', 'bird',
    'apple', 'ball', 'chair', 'door', 'flower', 'hat', 'key', 'lamp', 'phone', 'star',
    'baby', 'bed', 'cake', 'cloud', 'cup', 'eye', 'fire', 'hand', 'heart', 'ice',
    'juice', 'king', 'leaf', 'milk', 'nose', 'orange', 'pizza', 'queen', 'rain', 'snow',
  ],
  medium: [
    'airplane', 'basketball', 'butterfly', 'camera', 'dinosaur', 'elephant', 'football',
    'giraffe', 'hamburger', 'icecream', 'jellyfish', 'keyboard', 'lighthouse', 'mountain',
    'notebook', 'octopus', 'penguin', 'rainbow', 'sandwich', 'telescope', 'umbrella',
    'volcano', 'waterfall', 'xylophone', 'bicycle', 'chocolate', 'dolphin', 'envelope',
    'fireworks', 'guitar', 'helicopter', 'island', 'jacket', 'kangaroo', 'library',
  ],
  hard: [
    'astronaut', 'blacksmith', 'caterpillar', 'democracy', 'electricity', 'firefighter',
    'grandfather', 'helicopter', 'imagination', 'journalism', 'kaleidoscope', 'laboratory',
    'marshmallow', 'neighborhood', 'observatory', 'photographer', 'quarterback', 'revolution',
    'skateboard', 'thunderstorm', 'university', 'vegetarian', 'weightlifter', 'archaeology',
    'bankruptcy', 'celebration', 'dictionary', 'engineering', 'fascinating', 'grasshopper',
  ],
};

/**
 * Word Service Class
 */
export class WordService {
  private wordCache: Map<WordDifficulty, string[]> = new Map();
  private usedWords: Set<string> = new Set();

  /**
   * Get random word options for the drawer to choose from
   */
  async getWordOptions(count: number, difficulty: WordDifficulty = 'medium'): Promise<string[]> {
    try {
      // Try database first
      const words = await this.getWordsFromDatabase(count, difficulty);
      if (words.length >= count) {
        return words;
      }
    } catch (error) {
      logger.warn('Failed to get words from database, using fallback', { error });
    }

    // Fallback to hardcoded words
    return this.getWordsFromFallback(count, difficulty);
  }

  /**
   * Get words from database
   */
  private async getWordsFromDatabase(count: number, difficulty: WordDifficulty): Promise<string[]> {
    const result = await query(
      `SELECT word FROM skribbl_words
       WHERE difficulty = $1 AND is_active = true
       ORDER BY RANDOM()
       LIMIT $2`,
      [difficulty, count * 2] // Get more than needed to filter used
    );

    const words = result.rows
      .map((row) => row.word)
      .filter((word) => !this.usedWords.has(word))
      .slice(0, count);

    // Mark as used
    words.forEach((word) => this.usedWords.add(word));

    return words;
  }

  /**
   * Get words from fallback list
   */
  private getWordsFromFallback(count: number, difficulty: WordDifficulty): string[] {
    const allWords = FALLBACK_WORDS[difficulty];
    const availableWords = allWords.filter((word) => !this.usedWords.has(word));

    // Shuffle and pick
    const shuffled = this.shuffle(availableWords);
    const selected = shuffled.slice(0, count);

    // Mark as used
    selected.forEach((word) => this.usedWords.add(word));

    return selected;
  }

  /**
   * Reset used words (call at game start or when all words used)
   */
  resetUsedWords(): void {
    this.usedWords.clear();
  }

  /**
   * Add custom words for a team
   */
  async addCustomWords(teamId: number, words: string[]): Promise<void> {
    const values = words
      .map((word) => `(${teamId}, '${word.replace(/'/g, "''")}', 'custom', 'medium', true)`)
      .join(', ');

    await query(
      `INSERT INTO skribbl_words (team_id, word, category, difficulty, is_active)
       VALUES ${values}
       ON CONFLICT (word, COALESCE(team_id, 0)) DO NOTHING`
    );
  }

  /**
   * Shuffle array using Fisher-Yates
   */
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
