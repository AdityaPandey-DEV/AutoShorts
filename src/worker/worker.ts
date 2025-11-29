import { Worker } from 'bullmq';
import { connection } from '../services/queue';
import { handleGenerateAndUploadJob } from '../jobs/generateAndUpload';
import { incrementUsage } from '../services/usage';
import pool from '../db';
import { logger } from '../utils/logger';
import { JobData } from '../types';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not set');
}

logger.info('Starting BullMQ worker...');

// Create the worker
const worker = new Worker(
  'generate-upload',
  async (job) => {
    const jobData = job.data as JobData;
    const jobId = jobData.jobId;
    const userId = jobData.userId;

    logger.info(`Processing job ${jobId} for user ${userId}`);

    // Update job status to processing
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE jobs SET status = $1 WHERE id = $2',
        ['processing', jobId]
      );
    } finally {
      client.release();
    }

    try {
      // Process the job
      const result = await handleGenerateAndUploadJob(jobData);

      // Update job status to completed
      const updateClient = await pool.connect();
      try {
        await updateClient.query(
          `UPDATE jobs 
           SET status = $1, youtube_video_id = $2 
           WHERE id = $3`,
          ['completed', result.videoId, jobId]
        );
      } finally {
        updateClient.release();
      }

      // Increment usage counter
      try {
        await incrementUsage(userId, jobId);
      } catch (usageError) {
        logger.error(`Failed to increment usage for job ${jobId}:`, usageError);
        // Don't fail the job if usage tracking fails
      }

      logger.info(`Job ${jobId} completed successfully: ${result.url}`);
      return result;
    } catch (error) {
      // Update job status to failed
      const errorClient = await pool.connect();
      try {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await errorClient.query(
          `UPDATE jobs 
           SET status = $1, error_message = $2 
           WHERE id = $3`,
          ['failed', errorMessage, jobId]
        );
      } finally {
        errorClient.release();
      }

      logger.error(`Job ${jobId} failed:`, error);
      throw error; // Re-throw to mark job as failed in BullMQ
    }
  },
  {
    connection,
    concurrency: 1, // Process one job at a time (can be increased)
    limiter: {
      max: 5, // Max 5 jobs
      duration: 60000, // per minute
    },
  }
);

// Event handlers
worker.on('completed', (job) => {
  logger.info(`Job ${job?.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  logger.error('Worker error:', err);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  await connection.quit();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('Worker started and ready to process jobs');

