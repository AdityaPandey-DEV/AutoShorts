import pool from '../db';
import { encryptText, decryptText } from '../utils/crypto';

/**
 * Store an encrypted API key for a user
 * @param userId - User ID
 * @param provider - Provider name (e.g., 'gemini', 'pexels', 'youtube_refresh_token')
 * @param value - Plaintext API key or token to encrypt and store
 */
export async function storeApiKey(userId: number, provider: string, value: string): Promise<void> {
  const { encrypted, iv, authTag } = encryptText(value);
  const client = await pool.connect();
  
  try {
    await client.query(
      `INSERT INTO api_keys (user_id, provider, encrypted_value, iv, auth_tag)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, provider) 
       DO UPDATE SET 
         encrypted_value = $3, 
         iv = $4, 
         auth_tag = $5, 
         updated_at = CURRENT_TIMESTAMP`,
      [userId, provider, encrypted, iv, authTag]
    );
  } finally {
    client.release();
  }
}

/**
 * Retrieve and decrypt an API key for a user
 * @param userId - User ID
 * @param provider - Provider name
 * @returns Decrypted API key or null if not found
 */
export async function getApiKey(userId: number, provider: string): Promise<string | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT encrypted_value, iv, auth_tag FROM api_keys WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    const { encrypted_value, iv, auth_tag } = result.rows[0];
    return decryptText(encrypted_value, iv, auth_tag);
  } finally {
    client.release();
  }
}

/**
 * List all API keys for a user with masked previews
 * @param userId - User ID
 * @returns Array of provider names with masked key previews
 */
export async function listMaskedKeys(userId: number): Promise<Array<{ provider: string; masked: string }>> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT provider, encrypted_value FROM api_keys WHERE user_id = $1',
      [userId]
    );
    
    return result.rows.map((row: any) => ({
      provider: row.provider,
      masked: '****' + Buffer.from(row.encrypted_value).slice(-4).toString('hex')
    }));
  } finally {
    client.release();
  }
}

/**
 * Delete an API key for a user
 * @param userId - User ID
 * @param provider - Provider name
 */
export async function deleteApiKey(userId: number, provider: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query(
      'DELETE FROM api_keys WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );
  } finally {
    client.release();
  }
}

