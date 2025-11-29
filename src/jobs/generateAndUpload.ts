import { generateStory } from '../services/gemini';
import { searchAndDownload } from '../services/pexels';
import { synthesizeSpeech } from '../services/tts';
import { uploadVideo } from '../services/youtube';
import { getJobTempDir, cleanupTempDir } from '../utils/tempDir';
import { logger } from '../utils/logger';
import { JobData } from '../types';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Handle the generate and upload job
 * Orchestrates the entire pipeline: generate story, fetch assets, create TTS, assemble video, upload
 */
export async function handleGenerateAndUploadJob(jobData: JobData): Promise<any> {
  const { userId, prompt, jobId } = jobData;
  const tempDir = getJobTempDir(jobId);
  
  let clipPaths: string[] = [];
  let audioPath: string | null = null;
  let videoPath: string | null = null;

  try {
    logger.info(`Starting job ${jobId} for user ${userId}: ${prompt.substring(0, 50)}...`);

    // Step 1: Generate story using Gemini
    logger.info('Step 1: Generating story with Gemini...');
    const story = await generateStory(prompt, userId);
    
    logger.info(`Story generated: ${story.title_seed}`);
    logger.debug(`Scene prompts: ${story.scene_prompts.join(', ')}`);

    // Step 2: Safety check (placeholder - implement content moderation here)
    logger.info('Step 2: Running safety checks...');
    // TODO: Implement content moderation/safety filters
    // For now, we'll skip this but log it
    logger.info('Safety checks passed (placeholder)');

    // Step 3: Fetch video clips from Pexels for each scene
    logger.info('Step 3: Fetching video clips from Pexels...');
    clipPaths = [];
    
    for (let i = 0; i < story.scene_prompts.length && i < 4; i++) {
      const scenePrompt = story.scene_prompts[i];
      try {
        logger.info(`Fetching clip ${i + 1}/${story.scene_prompts.length}: ${scenePrompt}`);
        const clipPath = await searchAndDownload(scenePrompt, tempDir, userId);
        clipPaths.push(clipPath);
        logger.info(`Downloaded clip: ${clipPath}`);
      } catch (error) {
        logger.error(`Failed to download clip for scene "${scenePrompt}":`, error);
        // Continue with other clips if one fails
        if (clipPaths.length === 0) {
          throw new Error(`Failed to download any video clips: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    if (clipPaths.length === 0) {
      throw new Error('No video clips were downloaded');
    }

    // Step 4: Generate TTS audio from script
    logger.info('Step 4: Generating text-to-speech audio...');
    audioPath = path.join(tempDir, 'audio.mp3');
    await synthesizeSpeech(story.full_script, audioPath, userId);
    
    if (!fs.existsSync(audioPath)) {
      throw new Error('TTS audio file was not created');
    }
    
    logger.info(`TTS audio generated: ${audioPath}`);

    // Step 5: Assemble video using FFmpeg
    logger.info('Step 5: Assembling video with FFmpeg...');
    videoPath = path.join(tempDir, `output_${Date.now()}.mp4`);
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'ffmpeg_assemble.sh');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`FFmpeg script not found: ${scriptPath}`);
    }

    // Prepare arguments for FFmpeg script
    const args = [scriptPath, videoPath, audioPath, ...clipPaths];

    logger.info(`Running FFmpeg script with ${clipPaths.length} clips...`);
    
    const ffmpegProcess = spawn('bash', args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    // Capture FFmpeg output for debugging
    let ffmpegOutput = '';
    let ffmpegError = '';

    ffmpegProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      ffmpegOutput += output;
      logger.debug(`FFmpeg stdout: ${output.trim()}`);
    });

    ffmpegProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      ffmpegError += output;
      // FFmpeg outputs progress to stderr, so log as debug
      logger.debug(`FFmpeg stderr: ${output.trim()}`);
    });

    // Wait for FFmpeg to complete
    await new Promise<void>((resolve, reject) => {
      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}. Error: ${ffmpegError}`));
        }
      });

      ffmpegProcess.on('error', (error) => {
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });
    });

    if (!fs.existsSync(videoPath)) {
      throw new Error('Video file was not created by FFmpeg');
    }

    const videoStats = fs.statSync(videoPath);
    logger.info(`Video assembled successfully: ${videoPath} (${(videoStats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Step 6: Upload to YouTube
    logger.info('Step 6: Uploading video to YouTube...');
    const uploadResult = await uploadVideo({
      videoPath,
      title: story.title_seed,
      description: story.full_script,
      tags: story.tags_seed,
      userId,
    });

    logger.info(`Video uploaded successfully: ${uploadResult.url}`);

    // Step 7: Cleanup temporary files
    logger.info('Step 7: Cleaning up temporary files...');
    cleanupTempDir(tempDir);

    return {
      success: true,
      videoId: uploadResult.videoId,
      url: uploadResult.url,
      title: uploadResult.title,
    };
  } catch (error) {
    logger.error(`Job ${jobId} failed:`, error);
    
    // Cleanup on error
    if (tempDir && fs.existsSync(tempDir)) {
      cleanupTempDir(tempDir);
    }

    throw error;
  }
}

