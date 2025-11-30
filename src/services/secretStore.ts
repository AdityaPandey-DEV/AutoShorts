import pool from '../db';
import { encryptText, decryptText } from '../utils/crypto';

/**
 * Store an encrypted API key for a user
 * @param userId - User ID
 * @param provider - Provider name (e.g., 'gemini', 'pexels', 'youtube_refresh_token')
 * @param value - Plaintext API key or token to encrypt and store
 */
export async function storeApiKey(userId: number, provider: string, value: string): Promise<void> {
  console.log('[secretStore] storeApiKey called:', { userId, provider, valueLength: value?.length });
  
  let encrypted: Buffer;
  let iv: Buffer;
  let authTag: Buffer;
  
  // Step 1: Encrypt the API key
  console.log('[secretStore] Step 1: Encrypting API key...');
  try {
    const encryptedData = encryptText(value);
    encrypted = encryptedData.encrypted;
    iv = encryptedData.iv;
    authTag = encryptedData.authTag;
    console.log('[secretStore] Encryption successful:', { 
      encryptedLength: encrypted.length, 
      ivLength: iv.length, 
      authTagLength: authTag.length 
    });
  } catch (error: any) {
    console.error('[secretStore] Encryption failed:');
    console.error('[secretStore] Raw encryption error:', error);
    console.error('[secretStore] Error type:', error?.constructor?.name);
    console.error('[secretStore] Error message:', error?.message);
    console.error('[secretStore] Error toString:', error?.toString?.());
    
    if (error?.message?.includes('MASTER_KEY') || error?.toString?.()?.includes('MASTER_KEY')) {
      throw new Error('MASTER_KEY environment variable is not set. Cannot encrypt API key.');
    }
    throw new Error(`Failed to encrypt API key: ${error?.message || error?.toString?.() || 'Unknown encryption error'}`);
  }
  
  // Step 2: Connect to database
  console.log('[secretStore] Step 2: Connecting to database...');
  const client = await pool.connect();
  console.log('[secretStore] Database connection established');
  
  try {
    // Step 3: Insert/update API key
    console.log('[secretStore] Step 3: Executing database query...', { userId, provider });
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
    console.log('[secretStore] Database query executed successfully');
  } catch (error: any) {
    console.error('[secretStore] Database query failed:');
    console.error('[secretStore] Raw database error:', error);
    console.error('[secretStore] Error type:', error?.constructor?.name);
    console.error('[secretStore] Error code:', error?.code);
    console.error('[secretStore] Error message:', error?.message);
    console.error('[secretStore] Error detail:', error?.detail);
    console.error('[secretStore] Error constraint:', error?.constraint);
    console.error('[secretStore] Error toString:', error?.toString?.());
    
    // Re-throw with more context
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      throw new Error('Database connection failed. Please check DATABASE_URL environment variable.');
    } else if (error?.code === '42P01') {
      throw new Error('Database table "api_keys" does not exist. Please run database migrations.');
    } else if (error?.code === '23503') {
      throw new Error(`User with ID ${userId} does not exist in the database.`);
    }
    throw error;
  } finally {
    client.release();
    console.log('[secretStore] Database connection released');
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

