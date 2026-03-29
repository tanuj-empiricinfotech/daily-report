/**
 * Message Encryption Utility
 *
 * AES-256-GCM encryption for message content at rest.
 * Each message gets a unique IV (initialization vector) for security.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const key = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('MESSAGE_ENCRYPTION_KEY environment variable is required for message encryption');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt plaintext message content.
 * Returns the encrypted content (base64), IV (hex), and auth tag (hex).
 */
export function encryptMessage(plaintext: string): {
  encryptedContent: string;
  iv: string;
  authTag: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    encryptedContent: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt encrypted message content.
 * Requires the encrypted content (base64), IV (hex), and auth tag (hex).
 */
export function decryptMessage(
  encryptedContent: string,
  iv: string,
  authTag: string,
): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex'),
    { authTagLength: AUTH_TAG_LENGTH }
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedContent, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Check if encryption is configured.
 */
export function isEncryptionEnabled(): boolean {
  return !!process.env.MESSAGE_ENCRYPTION_KEY;
}
