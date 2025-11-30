import { generateStory } from './gemini';
import { getAdminApiKey } from './secretStore';
import axios from 'axios';
import { logger } from '../utils/logger';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface FlowchartAISuggestion {
  type: 'add_node' | 'modify_node' | 'connect_nodes' | 'suggest_structure';
  description: string;
  data?: any;
}

export interface FlowchartAIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: FlowchartAISuggestion[];
}

/**
 * Chat with AI about flowchart creation/modification
 */
export async function chatWithFlowchartAI(
  userId: number,
  message: string,
  currentFlowchart: {
    nodes: Array<{ id: string; type: string; label?: string; position: [number, number, number] }>;
    connections: Array<{ from: string; to: string }>;
  },
  conversationHistory: FlowchartAIChatMessage[] = []
): Promise<{ response: string; suggestions: FlowchartAISuggestion[] }> {
  console.log('[flowchartAI] chatWithFlowchartAI called:', { userId, messageLength: message?.length });
  
  // Step 1: Get admin API key (all API keys except YouTube are managed by admin)
  console.log('[flowchartAI] Step 1: Fetching admin API key for gemini...');
  let apiKey: string | null;
  
  try {
    apiKey = await getAdminApiKey('gemini');
    console.log('[flowchartAI] API key fetched:', { hasKey: !!apiKey });
  } catch (keyError: any) {
    console.error('[flowchartAI] Error fetching admin API key:');
    console.error('[flowchartAI] Raw key error:', keyError);
    console.error('[flowchartAI] Error type:', keyError?.constructor?.name);
    console.error('[flowchartAI] Error message:', keyError?.message);
    console.error('[flowchartAI] Error code:', keyError?.code);
    throw new Error(`Failed to retrieve Gemini API key: ${keyError?.message || 'Unknown error'}`);
  }
  
  if (!apiKey) {
    const errorMsg = 'Gemini API key not found. Please add your API key in admin settings first.';
    console.error('[flowchartAI]', errorMsg);
    throw new Error(errorMsg);
  }

  // Build context about current flowchart
  const flowchartContext = `
Current Flowchart State:
Nodes: ${currentFlowchart.nodes.map(n => `${n.type} (${n.label || n.type})`).join(', ') || 'None'}
Connections: ${currentFlowchart.connections.map(c => `${c.from} -> ${c.to}`).join(', ') || 'None'}

Available Node Types:
- ai-thinking: AI analyzes trends and generates content
- video-creator: Creates video content
- youtube-upload: Uploads to YouTube
- feedback-loop: Monitors performance and learns
- condition: Decision point
- delay: Wait for time
- trigger: Starting point
`;

  // Build conversation history
  const conversationText = conversationHistory
    .slice(-5) // Last 5 messages for context
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const fullPrompt = `You are an AI assistant helping users create automation flowcharts for YouTube Shorts generation.

${flowchartContext}

${conversationText ? `Previous conversation:\n${conversationText}\n` : ''}

User: ${message}

Assistant: Please provide helpful suggestions for creating or modifying the automation flowchart. You can:
1. Suggest adding nodes (specify type and where)
2. Suggest connecting nodes
3. Suggest modifying node properties
4. Explain how the automation should work
5. Help optimize the flowchart structure

Respond in a helpful, conversational way. If you suggest changes, format them clearly.`;

  // Step 2: Call Gemini API
  console.log('[flowchartAI] Step 2: Preparing to call Gemini API...');
  const modelName = 'models/gemini-2.5-flash'; // Use the working model we verified
  const apiUrl = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${apiKey}`;
  
  try {
    console.log('[flowchartAI] Calling Gemini API...', { 
      url: apiUrl.replace(apiKey, '***'), 
      modelName,
      promptLength: fullPrompt?.length 
    });
    logger.info('Calling Gemini API for flowchart chat');

    const response = await axios.post(
      apiUrl,
      {
        contents: [{
          parts: [{
            text: fullPrompt,
          }],
        }],
        generationConfig: {
          temperature: 0.7,
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

    console.log('[flowchartAI] Gemini API response received');
    console.log('[flowchartAI] Response status:', response.status);
    console.log('[flowchartAI] Response has candidates:', !!response.data?.candidates);
    
    const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
      'I apologize, but I could not generate a response. Please try again.';

    console.log('[flowchartAI] AI response extracted:', { responseLength: aiResponse?.length });

    // Parse suggestions from response (simple extraction)
    const suggestions = parseSuggestions(aiResponse, currentFlowchart);
    console.log('[flowchartAI] Suggestions parsed:', { count: suggestions?.length });

    return {
      response: aiResponse,
      suggestions,
    };
  } catch (error: any) {
    // Comprehensive error logging
    console.error('[flowchartAI] ====== ERROR IN GEMINI API CALL ======');
    console.error('[flowchartAI] Raw error object:', error);
    console.error('[flowchartAI] Error type:', error?.constructor?.name || typeof error);
    console.error('[flowchartAI] Error message (direct):', error?.message);
    console.error('[flowchartAI] Error toString():', error?.toString?.());
    console.error('[flowchartAI] Error code:', error?.code);
    console.error('[flowchartAI] Error stack:', error?.stack);
    
    if (error?.response) {
      console.error('[flowchartAI] HTTP Status:', error.response.status);
      console.error('[flowchartAI] HTTP Status Text:', error.response.statusText);
      console.error('[flowchartAI] Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data?.error) {
        const apiError = error.response.data.error;
        console.error('[flowchartAI] API Error message:', apiError.message);
        console.error('[flowchartAI] API Error code:', apiError.code);
        console.error('[flowchartAI] API Error status:', apiError.status);
      }
    } else if (error?.request) {
      console.error('[flowchartAI] Request was made but no response received');
      console.error('[flowchartAI] Request config:', error.config);
    }
    
    console.error('[flowchartAI] ======================================');
    
    // Also use logger
    logger.error('Error in flowchart AI chat:', {
      rawError: error,
      errorType: error?.constructor?.name || typeof error,
      message: error?.message,
      toString: error?.toString?.(),
      code: error?.code,
      stack: error?.stack,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data,
    });
    
    // Extract error message
    let errorMessage = 'AI chat failed';
    
    if (error?.response?.data?.error?.message) {
      errorMessage = `AI chat failed: ${error.response.data.error.message}`;
    } else if (error?.message) {
      errorMessage = `AI chat failed: ${error.message}`;
    } else if (error?.code === 'ECONNABORTED') {
      errorMessage = 'AI chat failed: Request timeout. Please try again.';
    } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      errorMessage = 'AI chat failed: Could not connect to Gemini API. Please check your internet connection.';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Parse suggestions from AI response
 */
function parseSuggestions(
  response: string,
  flowchart: {
    nodes: Array<{ id: string; type: string }>;
    connections: Array<{ from: string; to: string }>;
  }
): FlowchartAISuggestion[] {
  const suggestions: FlowchartAISuggestion[] = [];

  // Look for common patterns in AI responses
  const addNodeMatches = response.match(/add (?:an? )?([a-z-]+) (?:node|block)/gi);
  if (addNodeMatches) {
    addNodeMatches.forEach(match => {
      const nodeType = match.replace(/add (?:an? )?| (?:node|block)/gi, '').trim();
      if (nodeType && ['ai-thinking', 'video-creator', 'youtube-upload', 'feedback-loop'].includes(nodeType)) {
        suggestions.push({
          type: 'add_node',
          description: `Add ${nodeType} node`,
          data: { nodeType },
        });
      }
    });
  }

  return suggestions;
}

