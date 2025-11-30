import pool from '../db';
import { logger } from '../utils/logger';

export interface PlanFeatures {
  maxVideoLength: number;
  videoQuality: string[];
  customBranding: boolean;
  priorityProcessing: boolean;
  apiAccess: boolean;
  customTTSVoices: boolean;
  advancedAnalytics: boolean;
}

export interface Plan {
  id: number;
  planName: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number | null;
  maxVideosPerMonth: number | null;
  maxVideoLengthSeconds: number;
  features: PlanFeatures;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlanInput {
  planName: string;
  displayName: string;
  priceMonthly: number;
  priceYearly?: number;
  maxVideosPerMonth?: number | null;
  maxVideoLengthSeconds: number;
  features: PlanFeatures;
  isActive?: boolean;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  id: number;
}

/**
 * Get all active plans from database
 */
export async function getAllPlans(includeInactive: boolean = false): Promise<Plan[]> {
  const client = await pool.connect();
  
  try {
    let query = 'SELECT * FROM subscription_plans';
    const params: any[] = [];
    
    if (!includeInactive) {
      query += ' WHERE is_active = $1';
      params.push(true);
    }
    
    query += ' ORDER BY price_monthly ASC';
    
    const result = await client.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      planName: row.plan_name,
      displayName: row.display_name,
      priceMonthly: parseFloat(row.price_monthly),
      priceYearly: row.price_yearly ? parseFloat(row.price_yearly) : null,
      maxVideosPerMonth: row.max_videos_per_month,
      maxVideoLengthSeconds: row.max_video_length_seconds,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    logger.error('Error fetching plans:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get plan by ID
 */
export async function getPlanById(id: number): Promise<Plan | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM subscription_plans WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      planName: row.plan_name,
      displayName: row.display_name,
      priceMonthly: parseFloat(row.price_monthly),
      priceYearly: row.price_yearly ? parseFloat(row.price_yearly) : null,
      maxVideosPerMonth: row.max_videos_per_month,
      maxVideoLengthSeconds: row.max_video_length_seconds,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    logger.error('Error fetching plan by ID:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create a new plan
 */
export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `INSERT INTO subscription_plans 
       (plan_name, display_name, price_monthly, price_yearly, max_videos_per_month, 
        max_video_length_seconds, features, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.planName,
        input.displayName,
        input.priceMonthly,
        input.priceYearly || null,
        input.maxVideosPerMonth ?? null,
        input.maxVideoLengthSeconds,
        JSON.stringify(input.features),
        input.isActive ?? true,
      ]
    );
    
    const row = result.rows[0];
    logger.info(`Created plan: ${input.planName}`);
    
    return {
      id: row.id,
      planName: row.plan_name,
      displayName: row.display_name,
      priceMonthly: parseFloat(row.price_monthly),
      priceYearly: row.price_yearly ? parseFloat(row.price_yearly) : null,
      maxVideosPerMonth: row.max_videos_per_month,
      maxVideoLengthSeconds: row.max_video_length_seconds,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    logger.error('Error creating plan:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update an existing plan
 */
export async function updatePlan(id: number, input: Partial<CreatePlanInput>): Promise<Plan> {
  const client = await pool.connect();
  
  try {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    if (input.planName !== undefined) {
      updates.push(`plan_name = $${paramCount++}`);
      params.push(input.planName);
    }
    if (input.displayName !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      params.push(input.displayName);
    }
    if (input.priceMonthly !== undefined) {
      updates.push(`price_monthly = $${paramCount++}`);
      params.push(input.priceMonthly);
    }
    if (input.priceYearly !== undefined) {
      updates.push(`price_yearly = $${paramCount++}`);
      params.push(input.priceYearly ?? null);
    }
    if (input.maxVideosPerMonth !== undefined) {
      updates.push(`max_videos_per_month = $${paramCount++}`);
      params.push(input.maxVideosPerMonth ?? null);
    }
    if (input.maxVideoLengthSeconds !== undefined) {
      updates.push(`max_video_length_seconds = $${paramCount++}`);
      params.push(input.maxVideoLengthSeconds);
    }
    if (input.features !== undefined) {
      updates.push(`features = $${paramCount++}`);
      params.push(JSON.stringify(input.features));
    }
    if (input.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      params.push(input.isActive);
    }
    
    if (updates.length === 0) {
      const existing = await getPlanById(id);
      if (!existing) {
        throw new Error('Plan not found');
      }
      return existing;
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const result = await client.query(
      `UPDATE subscription_plans 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      throw new Error('Plan not found');
    }
    
    const row = result.rows[0];
    logger.info(`Updated plan: ${row.plan_name}`);
    
    return {
      id: row.id,
      planName: row.plan_name,
      displayName: row.display_name,
      priceMonthly: parseFloat(row.price_monthly),
      priceYearly: row.price_yearly ? parseFloat(row.price_yearly) : null,
      maxVideosPerMonth: row.max_videos_per_month,
      maxVideoLengthSeconds: row.max_video_length_seconds,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    logger.error('Error updating plan:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Soft delete a plan (set is_active to false)
 */
export async function deletePlan(id: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `UPDATE subscription_plans 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING plan_name`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Plan not found');
    }
    
    logger.info(`Deleted (deactivated) plan: ${result.rows[0].plan_name}`);
  } catch (error) {
    logger.error('Error deleting plan:', error);
    throw error;
  } finally {
    client.release();
  }
}

