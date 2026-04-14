import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Secure password hashing using Node.js built-in crypto.scrypt (no external deps).
 * - scrypt is a memory-hard KDF recommended by OWASP for password storage
 * - 16-byte random salt per password prevents rainbow table attacks
 * - timingSafeEqual prevents timing side-channel leaks during comparison
 */

const SCRYPT_KEYLEN = 64;

/**
 * Hash a plaintext password with a random salt.
 * @returns Formatted string: `salt:hash` (both hex-encoded)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored `salt:hash` string.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, 'hex');
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);
  if (hashBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(hashBuffer, derivedKey);
}
