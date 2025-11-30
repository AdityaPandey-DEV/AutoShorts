import fs from 'fs';
import path from 'path';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { getApiKey } from './secretStore';
import { logger } from '../utils/logger';

/**
 * Synthesize speech using Google Cloud Text-to-Speech
 * @param text - Text to convert to speech
 * @param outPath - Output file path for the audio
 * @param userId - User ID to retrieve API key/credentials
 * @returns Path to the generated audio file
 */
export async function synthesizeSpeech(
  text: string,
  outPath: string,
  userId: number
): Promise<string> {
  // Ensure output directory exists
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  try {
    // For Google Cloud TTS, we need service account credentials
    // The API key should be a JSON string of the service account credentials
    const apiKey = await getApiKey(userId, 'tts');
    
    if (!apiKey) {
      throw new Error('TTS API key (Google Cloud credentials) not found. Please add your credentials first.');
    }

    // Parse the credentials JSON
    let credentials;
    try {
      credentials = JSON.parse(apiKey);
    } catch (parseError) {
      // If it's not JSON, it might be a path to a credentials file
      if (fs.existsSync(apiKey)) {
        credentials = JSON.parse(fs.readFileSync(apiKey, 'utf8'));
      } else {
        throw new Error('Invalid TTS credentials format. Expected JSON or path to credentials file.');
      }
    }

    // Initialize the TTS client
    const client = new TextToSpeechClient({
      credentials,
    });

    logger.info('Synthesizing speech with Google Cloud TTS');

    // Clean the text for TTS (remove scene markers)
    const cleanText = text
      .replace(/\[SCENE\d+\]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) {
      throw new Error('No valid text to synthesize after cleaning');
    }

    // Configure the request
    const request = {
      input: { text: cleanText },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F', // Female voice, can be changed
        ssmlGender: 'FEMALE' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 1.0,
        pitch: 0,
      },
    };

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content returned from TTS service');
    }

    // Write the audio content to file
    fs.writeFileSync(outPath, response.audioContent, 'binary');

    logger.info(`Speech synthesized successfully: ${outPath}`);
    return outPath;
  } catch (error: any) {
    logger.error('TTS synthesis failed:', error);
    
    if (error.code === 7) {
      throw new Error('Invalid Google Cloud credentials');
    }
    
    if (error.message?.includes('credentials')) {
      throw new Error('TTS authentication failed. Please check your credentials.');
    }
    
    throw new Error(
      `Failed to synthesize speech: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Alternative: Simple TTS using a basic provider or mock
 * This can be used as a fallback or for testing
 */
export async function synthesizeSpeechSimple(
  text: string,
  outPath: string
): Promise<string> {
  // This is a placeholder - in production, you might want to use
  // a different TTS provider or keep this as a fallback
  
  logger.warn('Using simple TTS fallback - audio file will be empty');
  
  // Create an empty MP3 file as placeholder
  // In a real implementation, you'd call an actual TTS service here
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  // Write a minimal valid MP3 header (or empty file)
  fs.writeFileSync(outPath, Buffer.alloc(0));
  
  return outPath;
}




