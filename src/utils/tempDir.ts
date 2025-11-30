import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const TEMP_BASE_DIR = process.env.TEMP_DIR || '/tmp/autoshorts';

/**
 * Ensure the temporary directory exists
 * @returns Path to the temporary directory
 */
export function ensureTempDir(): string {
  if (!fs.existsSync(TEMP_BASE_DIR)) {
    fs.mkdirSync(TEMP_BASE_DIR, { recursive: true });
    logger.info(`Created temp directory: ${TEMP_BASE_DIR}`);
  }
  return TEMP_BASE_DIR;
}

/**
 * Get a unique temporary directory for a job
 * @param jobId - Job ID to create unique directory
 * @returns Path to the job-specific temporary directory
 */
export function getJobTempDir(jobId: number): string {
  ensureTempDir();
  const jobDir = path.join(TEMP_BASE_DIR, `job-${jobId}`);
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }
  return jobDir;
}

/**
 * Clean up a temporary directory
 * @param dirPath - Path to directory to clean up
 */
export function cleanupTempDir(dirPath: string): void {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      logger.debug(`Cleaned up temp directory: ${dirPath}`);
    }
  } catch (error) {
    logger.error(`Failed to cleanup temp directory ${dirPath}:`, error);
  }
}

/**
 * Clean up all temporary directories older than specified hours
 * @param olderThanHours - Remove directories older than this many hours
 */
export function cleanupOldTempDirs(olderThanHours: number = 24): void {
  try {
    if (!fs.existsSync(TEMP_BASE_DIR)) {
      return;
    }

    const entries = fs.readdirSync(TEMP_BASE_DIR, { withFileTypes: true });
    const now = Date.now();
    const maxAge = olderThanHours * 60 * 60 * 1000;

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(TEMP_BASE_DIR, entry.name);
        const stats = fs.statSync(dirPath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          cleanupTempDir(dirPath);
        }
      }
    }
  } catch (error) {
    logger.error('Failed to cleanup old temp directories:', error);
  }
}




