import { generateStory } from './gemini';
import { getApiKey } from './secretStore';
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
  const apiKey = await getApiKey(userId, 'gemini');
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please add your API key in admin settings first.');
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

  try {
    logger.info('Calling Gemini API for flowchart chat');

    const response = await axios.post(
      `${GEMINI_API_BASE}/models/gemini-pro:generateContent?key=${apiKey}`,
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
      }
    );

    const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 
      'I apologize, but I could not generate a response. Please try again.';

    // Parse suggestions from response (simple extraction)
    const suggestions = parseSuggestions(aiResponse, currentFlowchart);

    return {
      response: aiResponse,
      suggestions,
    };
  } catch (error: any) {
    logger.error('Error in flowchart AI chat:', error);
    throw new Error(`AI chat failed: ${error.response?.data?.error?.message || error.message}`);
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

