import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getMasterKey(): Buffer {
  const masterKey = process.env.MASTER_KEY;
  if (!masterKey) {
    throw new Error('MASTER_KEY environment variable is not set');
  }
  
  // Parse master key - support both hex and base64, but expect hex
  try {
    const key = Buffer.from(masterKey, 'hex');
    if (key.length !== 32) {
      throw new Error('MASTER_KEY must be 32 bytes (64 hex characters)');
    }
    return key;
  } catch (err) {
    throw new Error(`Invalid MASTER_KEY format: ${err instanceof Error ? err.message : 'unknown error'}`);
  }
}

export interface EncryptedData {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param plain - Plaintext string to encrypt
 * @returns Object containing encrypted buffer, IV, and auth tag
 */
export function encryptText(plain: string): EncryptedData {
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  const cipher = crypto.createCipheriv(ALGO, getMasterKey(), iv);
  
  const enc = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: enc,
    iv,
    authTag
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param encrypted - Encrypted buffer
 * @param iv - Initialization vector
 * @param authTag - Authentication tag
 * @returns Decrypted plaintext string
 */
export function decryptText(encrypted: Buffer, iv: Buffer, authTag: Buffer): string {
  const decipher = crypto.createDecipheriv(ALGO, getMasterKey(), iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

