import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { checkVideoLimit } from '../middleware/subscription';
import { incrementUsage } from '../services/usage';
import { generateUploadQueue } from '../services/queue';
import pool from '../db';
import { JobData } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /jobs
 * Create a new video generation job
 * Body: { prompt: string }
 * Requires active subscription/trial and available usage quota
 */
router.post('/', checkVideoLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required and must be a string' });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({ error: 'prompt cannot be empty' });
    }

    // Create job record in database
    const client = await pool.connect();
    let jobId: number;

    try {
      const result = await client.query(
        `INSERT INTO jobs (user_id, status, prompt) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [userId, 'pending', prompt.trim()]
      );
      
      jobId = result.rows[0].id;
      logger.info(`Created job ${jobId} for user ${userId}`);
    } finally {
      client.release();
    }

    // Create BullMQ job
    const jobData: JobData = {
      userId,
      prompt: prompt.trim(),
      jobId,
    };

    await generateUploadQueue.add('generate-upload', jobData, {
      jobId: jobId.toString(),
      priority: 0,
    });

    logger.info(`Added job ${jobId} to queue`);

    res.status(201).json({
      jobId,
      status: 'pending',
      message: 'Job created successfully',
    });
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({
      error: 'Failed to create job',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /jobs/:id
 * Get job status by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
        [jobId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const job = result.rows[0];
      res.json({
        id: job.id,
        status: job.status,
        prompt: job.prompt,
        youtubeVideoId: job.youtube_video_id,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error fetching job:', error);
    res.status(500).json({
      error: 'Failed to fetch job',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /jobs
 * List all jobs for the authenticated user
 * Query params: ?status=pending (optional filter)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const statusFilter = req.query.status as string | undefined;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const client = await pool.connect();
    
    try {
      let query = 'SELECT * FROM jobs WHERE user_id = $1';
      const params: any[] = [userId];

      if (statusFilter) {
        query += ' AND status = $2';
        params.push(statusFilter);
      }

      query += ' ORDER BY created_at DESC LIMIT 50';

      const result = await client.query(query, params);

      const jobs = result.rows.map((job: any) => ({
        id: job.id,
        status: job.status,
        prompt: job.prompt,
        youtubeVideoId: job.youtube_video_id,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      }));

      res.json({ jobs });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error listing jobs:', error);
    res.status(500).json({
      error: 'Failed to list jobs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

