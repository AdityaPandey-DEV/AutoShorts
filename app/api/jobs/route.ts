import { NextRequest, NextResponse } from 'next/server';
import { checkVideoLimit } from '@/lib/middleware';
import { getQueue } from '@/src/services/queue';
import pool from '@/src/db';
import { JobData } from '@/src/types';
import { logger } from '@/src/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Check video limit (includes auth check)
    const limitCheck = await checkVideoLimit(request);
    if (limitCheck.error) {
      return limitCheck.error;
    }

    const user = limitCheck.user!;
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'prompt cannot be empty' },
        { status: 400 }
      );
    }

    // Create job record in database
    const client = await pool.connect();
    let jobId: number;

    try {
      const result = await client.query(
        `INSERT INTO jobs (user_id, status, prompt) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [user.id, 'pending', prompt.trim()]
      );
      
      jobId = result.rows[0].id;
      logger.info(`Created job ${jobId} for user ${user.id}`);
    } finally {
      client.release();
    }

    // Create BullMQ job
    const jobData: JobData = {
      userId: user.id,
      prompt: prompt.trim(),
      jobId,
    };

    const queue = getQueue();
    await queue.add('generate-upload', jobData, {
      jobId: jobId.toString(),
      priority: 0,
    });

    logger.info(`Added job ${jobId} to queue`);

    return NextResponse.json({
      jobId,
      status: 'pending',
      message: 'Job created successfully',
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating job:', error);
    return NextResponse.json(
      {
        error: 'Failed to create job',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { requireAuth } = await import('@/lib/auth');
    const user = await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') || undefined;

    const client = await pool.connect();
    
    try {
      let query = 'SELECT * FROM jobs WHERE user_id = $1';
      const params: any[] = [user.id];

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

      return NextResponse.json({ jobs });
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error listing jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to list jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

