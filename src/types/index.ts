export interface User {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: number;
  user_id: number;
  provider: string;
  encrypted_value: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  created_at: Date;
  updated_at: Date;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: number;
  user_id: number;
  status: JobStatus;
  prompt: string;
  youtube_video_id: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface StoryResponse {
  title_seed: string;
  full_script: string;
  scene_prompts: string[];
  tags_seed: string[];
}

export interface JobData {
  userId: number;
  prompt: string;
  jobId: number;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email?: string;
  };
}

