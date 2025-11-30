import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { getApiKey } from './secretStore';
import { logger } from '../utils/logger';

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
}

export interface PexelsSearchResponse {
  page: number;
  per_page: number;
  total_results: number;
  videos: PexelsVideo[];
}

/**
 * Search for videos on Pexels
 * @param query - Search query string
 * @param userId - User ID to retrieve API key
 * @param perPage - Number of results per page (default: 3)
 * @returns Array of video objects
 */
export async function searchVideos(
  query: string,
  userId: number,
  perPage: number = 3
): Promise<PexelsVideo[]> {
  const apiKey = await getApiKey(userId, 'pexels');
  
  if (!apiKey) {
    throw new Error('Pexels API key not found. Please add your API key first.');
  }

  try {
    logger.info(`Searching Pexels for: ${query}`);

    const response = await axios.get<PexelsSearchResponse>(
      'https://api.pexels.com/videos/search',
      {
        params: {
          query,
          per_page: perPage,
          orientation: 'portrait', // For vertical shorts
        },
        headers: {
          Authorization: apiKey,
        },
        timeout: 30000,
      }
    );

    const videos = response.data.videos || [];
    
    if (videos.length === 0) {
      logger.warn(`No videos found for query: ${query}`);
      return [];
    }

    logger.info(`Found ${videos.length} videos for query: ${query}`);
    return videos;
  } catch (error: any) {
    logger.error('Pexels search failed:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Pexels API key');
    }
    
    if (error.response?.data) {
      throw new Error(
        `Pexels API error: ${error.response.data.error || 'Unknown error'}`
      );
    }
    
    throw new Error(
      `Failed to search Pexels: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Download a video from Pexels
 * @param videoUrl - URL of the video file to download
 * @param outDir - Directory to save the video
 * @param filename - Optional custom filename (without extension)
 * @returns Path to the downloaded video file
 */
export async function downloadVideo(
  videoUrl: string,
  outDir: string,
  filename?: string
): Promise<string> {
  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const ext = path.extname(new URL(videoUrl).pathname) || '.mp4';
  const outFilename = filename
    ? `${filename}${ext}`
    : `pexels_${Date.now()}${ext}`;
  const outPath = path.join(outDir, outFilename);

  try {
    logger.info(`Downloading video from Pexels: ${videoUrl}`);

    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      timeout: 60000, // 60 second timeout for downloads
    });

    const writer = fs.createWriteStream(outPath);

    await new Promise<void>((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.on('error', reject);
    });

    logger.info(`Video downloaded successfully: ${outPath}`);
    return outPath;
  } catch (error) {
    // Clean up partial file on error
    if (fs.existsSync(outPath)) {
      fs.unlinkSync(outPath);
    }
    
    logger.error('Video download failed:', error);
    throw new Error(
      `Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Search and download the best matching video from Pexels
 * @param query - Search query string
 * @param outDir - Directory to save the downloaded video
 * @param userId - User ID to retrieve API key
 * @returns Path to the downloaded video file
 */
export async function searchAndDownload(
  query: string,
  outDir: string,
  userId: number
): Promise<string> {
  // Search for videos
  const videos = await searchVideos(query, userId, 5);
  
  if (videos.length === 0) {
    throw new Error(`No videos found for query: ${query}`);
  }

  // Pick the first video (you could add logic to select the best one)
  const video = videos[0];

  // Find the best quality video file (prefer HD, portrait orientation)
  let videoFile = video.video_files.find(
    file => file.quality === 'hd' && file.height >= 1080
  );

  if (!videoFile) {
    // Fallback to any HD file
    videoFile = video.video_files.find(file => file.quality === 'hd');
  }

  if (!videoFile) {
    // Fallback to any file
    videoFile = video.video_files[0];
  }

  if (!videoFile) {
    throw new Error('No video file found in Pexels response');
  }

  // Download the video
  const outPath = await downloadVideo(
    videoFile.link,
    outDir,
    `pexels_${video.id}`
  );

  return outPath;
}




