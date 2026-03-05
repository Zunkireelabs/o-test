/**
 * Credential Encryption Layer (Worker Version)
 *
 * Provides AES-256-GCM encryption for connector credentials.
 * This is the ONLY place where credential decryption should occur.
 *
 * SECURITY REQUIREMENTS:
 * - Credentials are encrypted BEFORE storage in connector_credentials table
 * - Credentials are decrypted ONLY inside this worker when building connector instances
 * - Frontend NEVER receives decrypted credentials
 * - Secret key is stored in environment variable: ORCA_CONNECTOR_SECRET_KEY
 */

import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits - recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_ENV_VAR = 'ORCA_CONNECTOR_SECRET_KEY'

// ============================================
// KEY MANAGEMENT
// ============================================

let cachedKey: Buffer | null = null

/**
 * Get the encryption key from environment variable.
 * Validates format and caches for performance.
 *
 * @throws Error if key is missing or invalid
 */
function getEncryptionKey(): Buffer {
  if (cachedKey) {
    return cachedKey
  }

  const keyHex = process.env[KEY_ENV_VAR]

  if (!keyHex) {
    throw new Error(
      `[Crypto] FATAL: Missing required environment variable: ${KEY_ENV_VAR}. ` +
      `Worker cannot start without encryption key. ` +
      `Generate with: openssl rand -hex 32`
    )
  }

  // Validate hex format (64 chars = 32 bytes)
  if (!/^[a-fA-F0-9]{64}$/.test(keyHex)) {
    throw new Error(
      `[Crypto] FATAL: Invalid ${KEY_ENV_VAR} format. ` +
      `Must be a 64-character hex string (32 bytes). ` +
      `Generate with: openssl rand -hex 32`
    )
  }

  cachedKey = Buffer.from(keyHex, 'hex')
  return cachedKey
}

/**
 * Validate that the encryption key is configured.
 * Call this at worker startup to fail fast if misconfigured.
 *
 * @throws Error if key is missing or invalid
 */
export function validateEncryptionKeyConfigured(): void {
  getEncryptionKey()
  console.log('[Crypto] Encryption key validated successfully')
}

// ============================================
// ENCRYPTION
// ============================================

/**
 * Encrypt a JavaScript object to a base64-encoded ciphertext string.
 *
 * @param data - The object to encrypt
 * @returns Base64-encoded ciphertext (IV + AuthTag + Ciphertext)
 * @throws Error if encryption fails or key is invalid
 */
export function encrypt(data: Record<string, unknown>): string {
  const key = getEncryptionKey()

  // Generate random IV for each encryption
  const iv = crypto.randomBytes(IV_LENGTH)

  // Serialize data to JSON
  const plaintext = JSON.stringify(data)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ])

  // Get auth tag
  const authTag = cipher.getAuthTag()

  // Combine: IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted])

  // Return as base64
  return combined.toString('base64')
}

/**
 * Decrypt a base64-encoded ciphertext string to a JavaScript object.
 *
 * @param ciphertext - Base64-encoded ciphertext (IV + AuthTag + Ciphertext)
 * @returns Decrypted object
 * @throws Error if decryption fails, key is invalid, or data is tampered
 */
export function decrypt(ciphertext: string): Record<string, unknown> {
  const key = getEncryptionKey()

  // Decode from base64
  const combined = Buffer.from(ciphertext, 'base64')

  // Validate minimum length
  const minLength = IV_LENGTH + AUTH_TAG_LENGTH + 1
  if (combined.length < minLength) {
    throw new Error('[Crypto] Invalid ciphertext: too short')
  }

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  // Decrypt
  let decrypted: string
  try {
    decrypted = decipher.update(encrypted) + decipher.final('utf8')
  } catch (error) {
    // Authentication failed - data tampered or wrong key
    throw new Error('[Crypto] Decryption failed: authentication error (data may be tampered or key mismatch)')
  }

  // Parse JSON
  try {
    return JSON.parse(decrypted)
  } catch {
    throw new Error('[Crypto] Decryption failed: invalid JSON in decrypted data')
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Decrypt credentials from connector_credentials table.
 * Handles both encrypted (string) and legacy unencrypted (object) formats.
 *
 * @param encryptedCredentials - The encrypted_credentials value from DB
 * @returns Decrypted credentials object
 */
export function decryptCredentialsFromStorage(
  encryptedCredentials: string | Record<string, unknown>
): Record<string, unknown> {
  // Handle legacy unencrypted credentials (for migration)
  if (typeof encryptedCredentials === 'object') {
    console.warn('[Crypto] Warning: Found unencrypted credentials in storage. These should be migrated.')
    return encryptedCredentials
  }

  return decrypt(encryptedCredentials)
}

/**
 * Check if a value appears to be encrypted (base64 with correct structure).
 * Used for detecting legacy unencrypted data.
 */
export function isEncrypted(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }

  try {
    const decoded = Buffer.from(value, 'base64')
    // Check minimum length: IV + AuthTag + at least 1 byte of ciphertext
    return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1
  } catch {
    return false
  }
}
