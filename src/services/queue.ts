import { Queue } from 'bullmq';
import IORedis from 'ioredis';

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  connection.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  connection.on('connect', () => {
    console.log('Connected to Redis');
  });

  return connection;
}

// Lazy initialization to avoid errors during build
let _connection: IORedis | null = null;
let _queue: Queue | null = null;

function getConnection(): IORedis {
  if (!_connection) {
    _connection = getRedisConnection();
  }
  return _connection;
}

export function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('generate-upload', {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 100, // Keep max 100 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });
  }
  return _queue;
}

// Export lazy getter - don't initialize at module load
export function getGenerateUploadQueue(): Queue {
  return getQueue();
}

// For backwards compatibility - lazy initialization
// This will only initialize when first accessed
let _exportedQueue: Queue | null = null;
export const generateUploadQueue = {
  get add() {
    if (!_exportedQueue) _exportedQueue = getQueue();
    return _exportedQueue.add.bind(_exportedQueue);
  },
  get getJob() {
    if (!_exportedQueue) _exportedQueue = getQueue();
    return _exportedQueue.getJob.bind(_exportedQueue);
  },
  get getJobs() {
    if (!_exportedQueue) _exportedQueue = getQueue();
    return _exportedQueue.getJobs.bind(_exportedQueue);
  },
  get remove() {
    if (!_exportedQueue) _exportedQueue = getQueue();
    return _exportedQueue.remove.bind(_exportedQueue);
  },
  get close() {
    if (!_exportedQueue) _exportedQueue = getQueue();
    return _exportedQueue.close.bind(_exportedQueue);
  },
} as Queue;

export { getConnection };

