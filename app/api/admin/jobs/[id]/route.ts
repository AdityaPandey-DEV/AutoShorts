import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import pool from '@/src/db';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
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
        WHERE j.id = $1`,
        [jobId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      const job = result.rows[0];
      return NextResponse.json({
        ...job,
        created_at: new Date(job.created_at),
        updated_at: new Date(job.updated_at),
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('DELETE FROM jobs WHERE id = $1', [jobId]);
      return NextResponse.json({ message: 'Job deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}

