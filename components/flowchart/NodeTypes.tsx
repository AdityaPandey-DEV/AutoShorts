import { NodePin } from '@/src/types/flowchart';

export interface FlowchartNodeType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  category: 'input' | 'process' | 'output' | 'condition' | 'action';
  configurable?: boolean;
  // Pin definitions for Blueprint-style nodes
  inputPins?: NodePin[];
  outputPins?: NodePin[];
}

export const NODE_TYPES: Record<string, FlowchartNodeType> = {
  // Input/Data Nodes
  'string': {
    id: 'string',
    name: 'String',
    icon: '📝',
    color: '#10B981',
    description: 'Create or manage string values',
    category: 'input',
    configurable: true,
    inputPins: [],
    outputPins: [
      { id: 'value', name: 'Value', type: 'string' },
    ],
  },
  'number': {
    id: 'number',
    name: 'Number',
    icon: '🔢',
    color: '#10B981',
    description: 'Create or manage number values',
    category: 'input',
    configurable: true,
    inputPins: [],
    outputPins: [
      { id: 'value', name: 'Value', type: 'number' },
    ],
  },
  'trigger': {
    id: 'trigger',
    name: 'Trigger',
    icon: '⚡',
    color: '#8B5CF6',
    description: 'Starting point of the automation',
    category: 'input',
    configurable: false,
    inputPins: [],
    outputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
    ],
  },
  
  // AI Service Nodes
  'chatgpt': {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '🤖',
    color: '#10A37F',
    description: 'Generate content using OpenAI ChatGPT',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'prompt', name: 'Prompt', type: 'string', required: true },
      { id: 'systemMessage', name: 'System Message', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'response', name: 'Response', type: 'string' },
      { id: 'tokens', name: 'Tokens Used', type: 'number' },
    ],
  },
  'gemini': {
    id: 'gemini',
    name: 'Gemini',
    icon: '💎',
    color: '#4285F4',
    description: 'Generate content using Google Gemini AI',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'prompt', name: 'Prompt', type: 'string', required: true },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'response', name: 'Response', type: 'string' },
      { id: 'story', name: 'Story Data', type: 'object' },
    ],
  },
  
  // Video Generation Nodes
  'video-generation-ai': {
    id: 'video-generation-ai',
    name: 'Video Generation AI',
    icon: '🎬',
    color: '#EC4899',
    description: 'Generate video from script and prompts using AI',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'script', name: 'Script', type: 'string', required: true },
      { id: 'prompt', name: 'Visual Prompt', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'video', name: 'Video', type: 'object' },
      { id: 'videoUrl', name: 'Video URL', type: 'string' },
    ],
  },
  'pexels-search': {
    id: 'pexels-search',
    name: 'Pexels Search',
    icon: '🎥',
    color: '#EF4444',
    description: 'Search and download stock footage from Pexels',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'query', name: 'Search Query', type: 'string', required: true },
      { id: 'count', name: 'Video Count', type: 'number', defaultValue: 4, required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'videos', name: 'Videos', type: 'array' },
      { id: 'paths', name: 'File Paths', type: 'array' },
    ],
  },
  'tts': {
    id: 'tts',
    name: 'Text to Speech',
    icon: '🔊',
    color: '#F59E0B',
    description: 'Convert text to speech audio',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'text', name: 'Text', type: 'string', required: true },
      { id: 'voice', name: 'Voice Name', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'audio', name: 'Audio File', type: 'object' },
      { id: 'audioPath', name: 'Audio Path', type: 'string' },
    ],
  },
  
  // YouTube Nodes
  'youtube-upload': {
    id: 'youtube-upload',
    name: 'YouTube Upload',
    icon: '📺',
    color: '#FF0000',
    description: 'Upload video to YouTube channel',
    category: 'output',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'video', name: 'Video', type: 'object', required: true },
      { id: 'title', name: 'Title', type: 'string', required: false },
      { id: 'description', name: 'Description', type: 'string', required: false },
      { id: 'tags', name: 'Tags', type: 'array', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'videoId', name: 'Video ID', type: 'string' },
      { id: 'videoUrl', name: 'Video URL', type: 'string' },
    ],
  },
  'seo-optimizer': {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    icon: '🔍',
    color: '#8B5CF6',
    description: 'Generate SEO-optimized titles and descriptions',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'content', name: 'Content', type: 'string', required: true },
      { id: 'keywords', name: 'Keywords', type: 'array', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'title', name: 'Optimized Title', type: 'string' },
      { id: 'description', name: 'Optimized Description', type: 'string' },
      { id: 'tags', name: 'SEO Tags', type: 'array' },
    ],
  },
  'youtube-analytics': {
    id: 'youtube-analytics',
    name: 'YouTube Analytics',
    icon: '📊',
    color: '#16A34A',
    description: 'Get video performance metrics and analytics',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'videoId', name: 'Video ID', type: 'string', required: true },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'views', name: 'Views', type: 'number' },
      { id: 'likes', name: 'Likes', type: 'number' },
      { id: 'comments', name: 'Comments', type: 'number' },
      { id: 'metrics', name: 'All Metrics', type: 'object' },
    ],
  },
  'comment-analysis': {
    id: 'comment-analysis',
    name: 'Comment Analysis',
    icon: '💬',
    color: '#6366F1',
    description: 'Analyze video comments for sentiment and feedback',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'videoId', name: 'Video ID', type: 'string', required: true },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'sentiment', name: 'Sentiment', type: 'object' },
      { id: 'topComments', name: 'Top Comments', type: 'array' },
      { id: 'feedback', name: 'Feedback Summary', type: 'string' },
    ],
  },
  'feedback-loop': {
    id: 'feedback-loop',
    name: 'Feedback Loop',
    icon: '🔄',
    color: '#16A34A',
    description: 'Monitors performance and learns from feedback to improve future content',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'videoId', name: 'Video ID', type: 'string', required: false },
      { id: 'metrics', name: 'Metrics', type: 'object', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'insights', name: 'Insights', type: 'object' },
      { id: 'suggestions', name: 'Improvement Suggestions', type: 'array' },
    ],
  },
  
  // Control Flow Nodes
  'condition': {
    id: 'condition',
    name: 'Condition',
    icon: '❓',
    color: '#F59E0B',
    description: 'Decision point based on conditions',
    category: 'condition',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'condition', name: 'Condition', type: 'boolean', required: true },
    ],
    outputPins: [
      { id: 'true', name: 'True', type: 'execution' },
      { id: 'false', name: 'False', type: 'execution' },
    ],
  },
  'delay': {
    id: 'delay',
    name: 'Delay',
    icon: '⏱️',
    color: '#6366F1',
    description: 'Wait for specified time before next step',
    category: 'action',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'duration', name: 'Duration (ms)', type: 'number', defaultValue: 1000 },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
    ],
  },
  
  // Legacy nodes (keeping for backward compatibility)
  'ai-thinking': {
    id: 'ai-thinking',
    name: 'AI Thinking',
    icon: '🧠',
    color: '#DC2626',
    description: 'AI analyzes trends and generates content ideas',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'prompt', name: 'Prompt', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'ideas', name: 'Ideas', type: 'array' },
    ],
  },
  'video-creator': {
    id: 'video-creator',
    name: 'Video Creator',
    icon: '🎬',
    color: '#DC2626',
    description: 'Creates video content with visuals and narration',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'script', name: 'Script', type: 'string', required: false },
      { id: 'images', name: 'Images', type: 'array', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'video', name: 'Video', type: 'object' },
    ],
  },
};

export const NODE_TYPES_ARRAY = Object.values(NODE_TYPES);

export function getNodeType(id: string): FlowchartNodeType | null {
  return NODE_TYPES[id] || null;
}




