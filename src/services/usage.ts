import pool from '../db';
import { logger } from '../utils/logger';

/**
 * Increment usage counter for a user when a video is generated
 * Tracks both monthly (for paid users) and daily (for trial users) usage
 */
export async function incrementUsage(userId: number, jobId: number): Promise<void> {
  const client = await pool.connect();
  const now = new Date();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const year = now.getFullYear();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    // Track monthly usage (for paid users)
    await client.query(
      `INSERT INTO usage_tracking (user_id, job_id, month, year, videos_generated_count)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (user_id, month, year) 
       DO UPDATE SET 
         videos_generated_count = usage_tracking.videos_generated_count + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, jobId, month, year]
    );

    // Track daily usage (for trial users)
    await client.query(
      `INSERT INTO daily_usage_tracking (user_id, job_id, date, videos_generated_count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         videos_generated_count = daily_usage_tracking.videos_generated_count + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, jobId, today]
    );

    logger.debug(`Incremented usage for user ${userId}, job ${jobId}`);
  } finally {
    client.release();
  }
}

/**
 * Get current month usage for a user
 */
export async function getCurrentMonthUsage(userId: number): Promise<{
  videosGenerated: number;
  month: number;
  year: number;
}> {
  const client = await pool.connect();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const result = await client.query(
      `SELECT videos_generated_count, month, year 
       FROM usage_tracking 
       WHERE user_id = $1 AND month = $2 AND year = $3`,
      [userId, month, year]
    );

    if (result.rows.length === 0) {
      return {
        videosGenerated: 0,
        month,
        year,
      };
    }

    return {
      videosGenerated: result.rows[0].videos_generated_count || 0,
      month: result.rows[0].month,
      year: result.rows[0].year,
    };
  } finally {
    client.release();
  }
}

/**
 * Get current day usage for a user (for trial users)
 */
export async function getCurrentDayUsage(userId: number): Promise<{
  videosGenerated: number;
  date: string;
}> {
  const client = await pool.connect();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    const result = await client.query(
      `SELECT videos_generated_count, date 
       FROM daily_usage_tracking 
       WHERE user_id = $1 AND date = $2`,
      [userId, today]
    );

    if (result.rows.length === 0) {
      return {
        videosGenerated: 0,
        date: today,
      };
    }

    return {
      videosGenerated: result.rows[0].videos_generated_count || 0,
      date: result.rows[0].date,
    };
  } finally {
    client.release();
  }
}

/**
 * Check if user can generate a video based on daily limits (for trial users)
 */
export async function checkCanGenerateDaily(userId: number, maxVideosPerDay: number): Promise<{
  canGenerate: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
}> {
  const usage = await getCurrentDayUsage(userId);

  if (usage.videosGenerated >= maxVideosPerDay) {
    return {
      canGenerate: false,
      reason: `Daily limit of ${maxVideosPerDay} videos reached. Limit resets at midnight.`,
      currentUsage: usage.videosGenerated,
      limit: maxVideosPerDay,
    };
  }

  return {
    canGenerate: true,
    currentUsage: usage.videosGenerated,
    limit: maxVideosPerDay,
  };
}

/**
 * Check if user can generate a video based on usage limits
 * For trial users: checks daily limit
 * For paid users: checks monthly limit
 */
export async function checkCanGenerate(
  userId: number, 
  maxVideosPerMonth: number | null,
  isTrial: boolean = false,
  maxVideosPerDay?: number
): Promise<{
  canGenerate: boolean;
  reason?: string;
  currentUsage: number;
  limit: number | null;
}> {
  // For trial users, check daily limit
  if (isTrial && maxVideosPerDay) {
    const dailyCheck = await checkCanGenerateDaily(userId, maxVideosPerDay);
    return {
      canGenerate: dailyCheck.canGenerate,
      reason: dailyCheck.reason,
      currentUsage: dailyCheck.currentUsage,
      limit: dailyCheck.limit,
    };
  }

  // For paid users, check monthly limit
  // If unlimited, always allow
  if (maxVideosPerMonth === null) {
    return {
      canGenerate: true,
      currentUsage: 0,
      limit: null,
    };
  }

  const usage = await getCurrentMonthUsage(userId);

  if (usage.videosGenerated >= maxVideosPerMonth) {
    return {
      canGenerate: false,
      reason: `Monthly limit of ${maxVideosPerMonth} videos reached`,
      currentUsage: usage.videosGenerated,
      limit: maxVideosPerMonth,
    };
  }

  return {
    canGenerate: true,
    currentUsage: usage.videosGenerated,
    limit: maxVideosPerMonth,
  };
}

/**
 * Get usage statistics for a specific period
 */
export async function getUsageForPeriod(
  userId: number,
  month: number,
  year: number
): Promise<{
  videosGenerated: number;
  month: number;
  year: number;
}> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT videos_generated_count, month, year 
       FROM usage_tracking 
       WHERE user_id = $1 AND month = $2 AND year = $3`,
      [userId, month, year]
    );

    if (result.rows.length === 0) {
      return {
        videosGenerated: 0,
        month,
        year,
      };
    }

    return {
      videosGenerated: result.rows[0].videos_generated_count || 0,
      month: result.rows[0].month,
      year: result.rows[0].year,
    };
  } finally {
    client.release();
  }
}

/**
 * Get usage history for a user (last 12 months)
 */
export async function getUsageHistory(userId: number): Promise<Array<{
  month: number;
  year: number;
  videosGenerated: number;
}>> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT month, year, videos_generated_count 
       FROM usage_tracking 
       WHERE user_id = $1 
       ORDER BY year DESC, month DESC 
       LIMIT 12`,
      [userId]
    );

    return result.rows.map((row: any) => ({
      month: row.month,
      year: row.year,
      videosGenerated: row.videos_generated_count || 0,
    }));
  } finally {
    client.release();
  }
}




