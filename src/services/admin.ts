import pool from '../db';
import { logger } from '../utils/logger';

export interface UserListOptions {
  page?: number;
  limit?: number;
  search?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
}

export interface UserWithDetails {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: Date | null;
  subscription_ends_at: Date | null;
  is_admin: boolean;
  jobs_count: number;
  total_videos_generated: number;
}

export interface JobListOptions {
  page?: number;
  limit?: number;
  status?: string;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface JobWithUser {
  id: number;
  user_id: number;
  user_email: string;
  status: string;
  prompt: string;
  youtube_video_id: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SystemStats {
  totalUsers: number;
  usersThisMonth: number;
  activeUsers: number;
  totalJobs: number;
  jobsThisMonth: number;
  jobsByStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  totalRevenue: number;
  revenueThisMonth: number;
  subscriptionBreakdown: {
    trial: number;
    active: number;
    cancelled: number;
    expired: number;
  };
  totalVideosGenerated: number;
  averageVideosPerUser: number;
}

/**
 * Get all users with optional filters and pagination
 */
export async function getAllUsers(options: UserListOptions = {}): Promise<{
  users: UserWithDetails[];
  total: number;
  page: number;
  limit: number;
}> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  
  try {
    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (options.search) {
      conditions.push(`email ILIKE $${paramIndex}`);
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    if (options.subscriptionStatus) {
      conditions.push(`subscription_status = $${paramIndex}`);
      params.push(options.subscriptionStatus);
      paramIndex++;
    }

    if (options.subscriptionPlan) {
      conditions.push(`subscription_plan = $${paramIndex}`);
      params.push(options.subscriptionPlan);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get users with job counts and usage
    params.push(limit, offset);
    const result = await client.query(
      `SELECT 
        u.id,
        u.email,
        u.created_at,
        u.updated_at,
        u.subscription_status,
        u.subscription_plan,
        u.trial_ends_at,
        u.subscription_ends_at,
        u.is_admin,
        COALESCE(j.jobs_count, 0) as jobs_count,
        COALESCE(ut.total_videos, 0) as total_videos_generated
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as jobs_count
        FROM jobs
        GROUP BY user_id
      ) j ON u.id = j.user_id
      LEFT JOIN (
        SELECT user_id, SUM(videos_generated_count) as total_videos
        FROM usage_tracking
        GROUP BY user_id
      ) ut ON u.id = ut.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      users: result.rows.map(row => ({
        ...row,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        trial_ends_at: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
        subscription_ends_at: row.subscription_ends_at ? new Date(row.subscription_ends_at) : null,
        jobs_count: parseInt(row.jobs_count, 10),
        total_videos_generated: parseInt(row.total_videos_generated, 10),
      })),
      total,
      page,
      limit,
    };
  } finally {
    client.release();
  }
}

/**
 * Get user details with full information
 */
export async function getUserWithDetails(userId: number): Promise<UserWithDetails | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT 
        u.id,
        u.email,
        u.created_at,
        u.updated_at,
        u.subscription_status,
        u.subscription_plan,
        u.trial_ends_at,
        u.subscription_ends_at,
        u.is_admin,
        COALESCE(j.jobs_count, 0) as jobs_count,
        COALESCE(ut.total_videos, 0) as total_videos_generated
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as jobs_count
        FROM jobs
        WHERE user_id = $1
        GROUP BY user_id
      ) j ON u.id = j.user_id
      LEFT JOIN (
        SELECT user_id, SUM(videos_generated_count) as total_videos
        FROM usage_tracking
        WHERE user_id = $1
        GROUP BY user_id
      ) ut ON u.id = ut.user_id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      trial_ends_at: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
      subscription_ends_at: row.subscription_ends_at ? new Date(row.subscription_ends_at) : null,
      jobs_count: parseInt(row.jobs_count, 10),
      total_videos_generated: parseInt(row.total_videos_generated, 10),
    };
  } finally {
    client.release();
  }
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(
  userId: number,
  updates: {
    subscriptionStatus?: string;
    subscriptionPlan?: string | null;
    subscriptionEndsAt?: Date | null;
    trialEndsAt?: Date | null;
  }
): Promise<void> {
  const client = await pool.connect();
  
  try {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.subscriptionStatus !== undefined) {
      fields.push(`subscription_status = $${paramIndex}`);
      params.push(updates.subscriptionStatus);
      paramIndex++;
    }

    if (updates.subscriptionPlan !== undefined) {
      fields.push(`subscription_plan = $${paramIndex}`);
      params.push(updates.subscriptionPlan);
      paramIndex++;
    }

    if (updates.subscriptionEndsAt !== undefined) {
      fields.push(`subscription_ends_at = $${paramIndex}`);
      params.push(updates.subscriptionEndsAt);
      paramIndex++;
    }

    if (updates.trialEndsAt !== undefined) {
      fields.push(`trial_ends_at = $${paramIndex}`);
      params.push(updates.trialEndsAt);
      paramIndex++;
    }

    if (fields.length === 0) {
      return;
    }

    params.push(userId);
    await client.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
      params
    );
  } finally {
    client.release();
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
  } finally {
    client.release();
  }
}

/**
 * Get all jobs with optional filters
 */
export async function getAllJobs(options: JobListOptions = {}): Promise<{
  jobs: JobWithUser[];
  total: number;
  page: number;
  limit: number;
}> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (options.status) {
      conditions.push(`j.status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    if (options.userId) {
      conditions.push(`j.user_id = $${paramIndex}`);
      params.push(options.userId);
      paramIndex++;
    }

    if (options.dateFrom) {
      conditions.push(`j.created_at >= $${paramIndex}`);
      params.push(options.dateFrom);
      paramIndex++;
    }

    if (options.dateTo) {
      conditions.push(`j.created_at <= $${paramIndex}`);
      params.push(options.dateTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM jobs j ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get jobs with user info
    params.push(limit, offset);
    const result = await client.query(
      `SELECT 
        j.id,
        j.user_id,
        u.email as user_email,
        j.status,
        j.prompt,
        j.youtube_video_id,
        j.error_message,
        j.created_at,
        j.updated_at
      FROM jobs j
      JOIN users u ON j.user_id = u.id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      jobs: result.rows.map(row => ({
        ...row,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })),
      total,
      page,
      limit,
    };
  } finally {
    client.release();
  }
}

/**
 * Get system statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  const client = await pool.connect();
  
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total users
    const totalUsersResult = await client.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);

    // Users this month
    const usersThisMonthResult = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
      [startOfMonth]
    );
    const usersThisMonth = parseInt(usersThisMonthResult.rows[0].count, 10);

    // Active users (have subscription or trial)
    const activeUsersResult = await client.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE subscription_status IN ('trial', 'active') 
       AND (trial_ends_at IS NULL OR trial_ends_at > NOW() OR subscription_ends_at IS NULL OR subscription_ends_at > NOW())`
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count, 10);

    // Total jobs
    const totalJobsResult = await client.query('SELECT COUNT(*) as count FROM jobs');
    const totalJobs = parseInt(totalJobsResult.rows[0].count, 10);

    // Jobs this month
    const jobsThisMonthResult = await client.query(
      'SELECT COUNT(*) as count FROM jobs WHERE created_at >= $1',
      [startOfMonth]
    );
    const jobsThisMonth = parseInt(jobsThisMonthResult.rows[0].count, 10);

    // Jobs by status
    const jobsByStatusResult = await client.query(
      `SELECT status, COUNT(*) as count 
       FROM jobs 
       GROUP BY status`
    );
    const jobsByStatus: any = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
    jobsByStatusResult.rows.forEach((row: any) => {
      jobsByStatus[row.status] = parseInt(row.count, 10);
    });

    // Total revenue
    const revenueResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'`
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);

    // Revenue this month
    const revenueThisMonthResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM payments 
       WHERE status = 'completed' AND created_at >= $1`,
      [startOfMonth]
    );
    const revenueThisMonth = parseFloat(revenueThisMonthResult.rows[0].total || 0);

    // Subscription breakdown
    const subscriptionResult = await client.query(
      `SELECT subscription_status, COUNT(*) as count 
       FROM users 
       GROUP BY subscription_status`
    );
    const subscriptionBreakdown: any = {
      trial: 0,
      active: 0,
      cancelled: 0,
      expired: 0,
    };
    subscriptionResult.rows.forEach((row: any) => {
      subscriptionBreakdown[row.subscription_status] = parseInt(row.count, 10);
    });

    // Total videos generated
    const videosResult = await client.query(
      'SELECT COALESCE(SUM(videos_generated_count), 0) as total FROM usage_tracking'
    );
    const totalVideosGenerated = parseInt(videosResult.rows[0].total, 10);

    // Average videos per user
    const averageVideosPerUser = totalUsers > 0 ? totalVideosGenerated / totalUsers : 0;

    return {
      totalUsers,
      usersThisMonth,
      activeUsers,
      totalJobs,
      jobsThisMonth,
      jobsByStatus,
      totalRevenue,
      revenueThisMonth,
      subscriptionBreakdown,
      totalVideosGenerated,
      averageVideosPerUser,
    };
  } finally {
    client.release();
  }
}

/**
 * Get usage for a specific period
 */
export async function getUsageForPeriod(month?: number, year?: number, userId?: number): Promise<{
  usage: Array<{
    user_id: number;
    user_email: string;
    month: number;
    year: number;
    videos_generated_count: number;
  }>;
}> {
  const client = await pool.connect();
  
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (month) {
      conditions.push(`month = $${paramIndex}`);
      params.push(month);
      paramIndex++;
    }

    if (year) {
      conditions.push(`year = $${paramIndex}`);
      params.push(year);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`ut.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await client.query(
      `SELECT 
        ut.user_id,
        u.email as user_email,
        ut.month,
        ut.year,
        ut.videos_generated_count
      FROM usage_tracking ut
      JOIN users u ON ut.user_id = u.id
      ${whereClause}
      ORDER BY ut.year DESC, ut.month DESC, ut.videos_generated_count DESC`,
      params
    );

    return {
      usage: result.rows,
    };
  } finally {
    client.release();
  }
}

