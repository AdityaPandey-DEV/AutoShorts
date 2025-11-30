import pool from '../db';
import { logger } from '../utils/logger';

export interface FlowchartData {
  nodes: Array<{
    id: string;
    type: string;
    position: [number, number, number];
    label?: string;
    data?: any;
  }>;
  connections: Array<{
    id: string;
    from: string;
    to: string;
  }>;
}

export interface Flowchart {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  flowchartData: FlowchartData;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save a new flowchart
 */
export async function saveFlowchart(
  userId: number,
  name: string,
  flowchartData: FlowchartData,
  description?: string
): Promise<Flowchart> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `INSERT INTO flowcharts (user_id, name, description, flowchart_data, is_template)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, user_id, name, description, flowchart_data, is_template, created_at, updated_at`,
      [userId, name, description || null, JSON.stringify(flowchartData)]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      flowchartData: row.flowchart_data,
      isTemplate: row.is_template,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  } finally {
    client.release();
  }
}

/**
 * Get all flowcharts for a user
 */
export async function getUserFlowcharts(userId: number): Promise<Flowchart[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT id, user_id, name, description, flowchart_data, is_template, created_at, updated_at
       FROM flowcharts
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      flowchartData: row.flowchart_data,
      isTemplate: row.is_template,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } finally {
    client.release();
  }
}

/**
 * Get a flowchart by ID
 */
export async function getFlowchart(flowchartId: number, userId?: number): Promise<Flowchart | null> {
  const client = await pool.connect();
  
  try {
    let query = 'SELECT id, user_id, name, description, flowchart_data, is_template, created_at, updated_at FROM flowcharts WHERE id = $1';
    const params: any[] = [flowchartId];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      flowchartData: row.flowchart_data,
      isTemplate: row.is_template,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  } finally {
    client.release();
  }
}

/**
 * Update a flowchart
 */
export async function updateFlowchart(
  flowchartId: number,
  userId: number,
  updates: {
    name?: string;
    description?: string;
    flowchartData?: FlowchartData;
  }
): Promise<Flowchart | null> {
  const client = await pool.connect();
  
  try {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      params.push(updates.name);
      paramIndex++;
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      params.push(updates.description);
      paramIndex++;
    }

    if (updates.flowchartData !== undefined) {
      fields.push(`flowchart_data = $${paramIndex}`);
      params.push(JSON.stringify(updates.flowchartData));
      paramIndex++;
    }

    if (fields.length === 0) {
      return getFlowchart(flowchartId, userId);
    }

    params.push(flowchartId, userId);
    await client.query(
      `UPDATE flowcharts 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      params
    );

    return getFlowchart(flowchartId, userId);
  } finally {
    client.release();
  }
}

/**
 * Delete a flowchart
 */
export async function deleteFlowchart(flowchartId: number, userId: number): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'DELETE FROM flowcharts WHERE id = $1 AND user_id = $2',
      [flowchartId, userId]
    );

    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}




