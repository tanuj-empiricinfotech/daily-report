/**
 * Room Code and ID Utilities
 *
 * Generates random alphanumeric codes and IDs.
 */

/**
 * Allowed characters for room codes
 * Excludes confusing characters: 0, O, I, L, 1
 */
const ALLOWED_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Characters for general IDs (includes lowercase)
 */
const ID_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Default room code length
 */
const DEFAULT_CODE_LENGTH = 6;

/**
 * Generate a random room code
 *
 * @param length - Length of the code to generate (default: 6)
 * @returns A random uppercase alphanumeric code
 *
 * @example
 * generateRoomCode() // Returns something like "X7KM3N"
 * generateRoomCode(4) // Returns something like "AB3K"
 */
export function generateRoomCode(length: number = DEFAULT_CODE_LENGTH): string {
  let code = '';
  const charactersLength = ALLOWED_CHARACTERS.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    code += ALLOWED_CHARACTERS[randomIndex];
  }

  return code;
}

/**
 * Generate a random ID (like nanoid)
 *
 * @param length - Length of the ID to generate (default: 8)
 * @returns A random alphanumeric ID
 *
 * @example
 * generateId() // Returns something like "xK7mN3pQ"
 * generateId(12) // Returns a 12-character ID
 */
export function generateId(length: number = 8): string {
  let id = '';
  const charactersLength = ID_CHARACTERS.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    id += ID_CHARACTERS[randomIndex];
  }

  return id;
}
