import fs from 'fs';
import { google } from 'googleapis';
import { getApiKey } from './secretStore';
import { logger } from '../utils/logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing required Google OAuth environment variables');
}

export interface UploadVideoParams {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  userId: number;
}

export interface UploadVideoResult {
  videoId: string;
  url: string;
  title: string;
}

/**
 * Upload a video to YouTube
 * @param params - Upload parameters including video path, metadata, and user ID
 * @returns Video ID and URL
 */
export async function uploadVideo(params: UploadVideoParams): Promise<UploadVideoResult> {
  const { videoPath, title, description, tags, userId } = params;

  // Verify video file exists
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  // Get refresh token from database
  const refreshToken = await getApiKey(userId, 'youtube_refresh_token');
  
  if (!refreshToken) {
    throw new Error('YouTube refresh token not found. Please connect your YouTube account first.');
  }

  // Set up OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // Refresh access token if needed
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    logger.debug('Refreshed YouTube access token');
  } catch (error) {
    logger.error('Failed to refresh YouTube access token:', error);
    throw new Error('Failed to authenticate with YouTube. Please reconnect your account.');
  }

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    logger.info(`Uploading video to YouTube: ${title}`);

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: tags,
          categoryId: '24', // Entertainment category
        },
        status: {
          privacyStatus: 'public', // or 'unlisted', 'private'
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    if (!response.data.id) {
      throw new Error('Upload succeeded but no video ID returned');
    }

    const videoId = response.data.id;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    logger.info(`Video uploaded successfully: ${url}`);

    return {
      videoId,
      url,
      title: response.data.snippet?.title || title,
    };
  } catch (error: any) {
    logger.error('YouTube upload failed:', error);
    
    if (error.response?.data?.error) {
      const errorDetails = error.response.data.error;
      throw new Error(
        `YouTube API error: ${errorDetails.message || 'Unknown error'}`
      );
    }
    
    throw new Error(
      `Failed to upload video to YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}




