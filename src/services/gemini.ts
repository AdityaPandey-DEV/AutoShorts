import axios from 'axios';
import { getApiKey } from './secretStore';
import { StoryResponse } from '../types';
import { logger } from '../utils/logger';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Generate a story using Google Gemini API
 * @param promptTemplate - The prompt template for story generation
 * @param userId - User ID to retrieve API key
 * @returns Structured story response with title, script, scene prompts, and tags
 */
export async function generateStory(
  promptTemplate: string,
  userId: number
): Promise<StoryResponse> {
  // Get API key from database
  const apiKey = await getApiKey(userId, 'gemini');
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please add your API key first.');
  }

  // Construct the full prompt for a YouTube Shorts script
  const fullPrompt = `${promptTemplate}

Generate a short, engaging YouTube Shorts script (30-60 seconds) with the following structure:

1. A catchy title (2-6 words)
2. A full script with scene descriptions in [SCENE] tags, like:
   [SCENE1] Description of first scene
   [SCENE2] Description of second scene
   etc.
3. Visual scene prompts for video search (2-4 short, descriptive prompts)
4. Relevant tags for YouTube (5-10 tags)

Return the response as a JSON object with this exact structure:
{
  "title_seed": "Short catchy title",
  "full_script": "[SCENE1] Scene 1 description and dialogue\n[SCENE2] Scene 2 description and dialogue",
  "scene_prompts": ["visual prompt 1", "visual prompt 2", "visual prompt 3"],
  "tags_seed": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  try {
    logger.info('Calling Gemini API for story generation');

    const response = await axios.post(
      `${GEMINI_API_BASE}/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content returned from Gemini API');
    }

    logger.debug('Received response from Gemini API');

    // Try to extract JSON from the response
    // Gemini might wrap JSON in markdown code blocks
    let jsonStr = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    let storyData: StoryResponse;
    
    try {
      storyData = JSON.parse(jsonStr);
    } catch (parseError) {
      // If JSON parsing fails, try to extract fields manually
      logger.warn('Failed to parse JSON, attempting to extract manually');
      
      // Fallback: create a structured response from the text
      const lines = content.split('\n').filter((line: string) => line.trim());
      storyData = {
        title_seed: lines[0]?.replace(/^title[:\s]*/i, '').trim() || 'Untitled Short',
        full_script: content.substring(0, 500), // Use first 500 chars as script
        scene_prompts: [
          promptTemplate.split(' ').slice(0, 4).join(' '),
          promptTemplate.split(' ').slice(4, 8).join(' ') || promptTemplate,
        ],
        tags_seed: ['shorts', 'viral', 'funny', 'trending'],
      };
    }

    // Validate required fields
    if (!storyData.title_seed || !storyData.full_script) {
      throw new Error('Invalid story response: missing required fields');
    }

    // Ensure arrays exist and have at least one element
    if (!storyData.scene_prompts || storyData.scene_prompts.length === 0) {
      storyData.scene_prompts = [promptTemplate];
    }

    if (!storyData.tags_seed || storyData.tags_seed.length === 0) {
      storyData.tags_seed = ['shorts', 'viral'];
    }

    logger.info('Story generated successfully');
    return storyData;
  } catch (error: any) {
    logger.error('Gemini API call failed:', error);
    
    if (error.response?.data?.error) {
      const errorDetails = error.response.data.error;
      throw new Error(
        `Gemini API error: ${errorDetails.message || 'Unknown error'}`
      );
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Gemini API request timed out');
    }
    
    throw new Error(
      `Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

