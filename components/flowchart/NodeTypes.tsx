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
  'ai-node': {
    id: 'ai-node',
    name: 'AI Node',
    icon: '🤖',
    color: '#8B5CF6',
    description: 'Generic AI node with configurable input/output pins',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'input', name: 'Input', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'output', name: 'Output', type: 'string' },
    ],
  },
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
      { id: 'temperature', name: 'Temperature', type: 'number', defaultValue: 0.7, required: false },
      { id: 'maxTokens', name: 'Max Tokens', type: 'number', defaultValue: 1000, required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'response', name: 'Response', type: 'string' },
      { id: 'tokens', name: 'Tokens Used', type: 'number' },
      { id: 'model', name: 'Model Used', type: 'string' },
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
      { id: 'temperature', name: 'Temperature', type: 'number', defaultValue: 0.9, required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'response', name: 'Response', type: 'string' },
      { id: 'story', name: 'Story Data', type: 'object' },
      { id: 'json', name: 'JSON Output', type: 'json' },
    ],
  },
  'claude': {
    id: 'claude',
    name: 'Claude',
    icon: '🧠',
    color: '#FF6B35',
    description: 'Generate content using Anthropic Claude AI',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'prompt', name: 'Prompt', type: 'string', required: true },
      { id: 'systemPrompt', name: 'System Prompt', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'response', name: 'Response', type: 'string' },
      { id: 'usage', name: 'Usage Stats', type: 'object' },
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
  
  // Social Media Nodes
  'social-media': {
    id: 'social-media',
    name: 'Social Media',
    icon: '📱',
    color: '#6366F1',
    description: 'Generic social media node with configurable pins for any platform',
    category: 'output',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'content', name: 'Content', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'postId', name: 'Post ID', type: 'string' },
    ],
  },
  'youtube-upload': {
    id: 'youtube-upload',
    name: 'YouTube Upload',
    icon: '📺',
    color: '#FF0000',
    description: 'Upload video to YouTube channel with multiple input pins',
    category: 'output',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'video', name: 'Video', type: 'video', required: true },
      { id: 'title', name: 'Title', type: 'string', required: false },
      { id: 'description', name: 'Description', type: 'string', required: false },
      { id: 'tags', name: 'Tags', type: 'array', required: false },
      { id: 'thumbnail', name: 'Thumbnail', type: 'image', required: false },
      { id: 'category', name: 'Category', type: 'string', required: false },
      { id: 'visibility', name: 'Visibility', type: 'string', defaultValue: 'public', required: false },
      { id: 'scheduledTime', name: 'Scheduled Time', type: 'date', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'videoId', name: 'Video ID', type: 'string' },
      { id: 'videoUrl', name: 'Video URL', type: 'url' },
      { id: 'thumbnailUrl', name: 'Thumbnail URL', type: 'url' },
    ],
  },
  'instagram-post': {
    id: 'instagram-post',
    name: 'Instagram Post',
    icon: '📷',
    color: '#E4405F',
    description: 'Upload image or video to Instagram',
    category: 'output',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'image', name: 'Image', type: 'image', required: false },
      { id: 'video', name: 'Video', type: 'video', required: false },
      { id: 'caption', name: 'Caption', type: 'string', required: false },
      { id: 'location', name: 'Location', type: 'string', required: false },
      { id: 'hashtags', name: 'Hashtags', type: 'array', required: false },
      { id: 'tagUsers', name: 'Tag Users', type: 'array', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'postId', name: 'Post ID', type: 'string' },
      { id: 'postUrl', name: 'Post URL', type: 'url' },
    ],
  },
  'tiktok-upload': {
    id: 'tiktok-upload',
    name: 'TikTok Upload',
    icon: '🎵',
    color: '#000000',
    description: 'Upload video to TikTok',
    category: 'output',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'video', name: 'Video', type: 'video', required: true },
      { id: 'caption', name: 'Caption', type: 'string', required: false },
      { id: 'hashtags', name: 'Hashtags', type: 'array', required: false },
      { id: 'sound', name: 'Sound', type: 'audio', required: false },
      { id: 'privacy', name: 'Privacy', type: 'string', defaultValue: 'public', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'videoId', name: 'Video ID', type: 'string' },
      { id: 'videoUrl', name: 'Video URL', type: 'url' },
    ],
  },
  'facebook-post': {
    id: 'facebook-post',
    name: 'Facebook Post',
    icon: '👥',
    color: '#1877F2',
    description: 'Create post on Facebook',
    category: 'output',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'message', name: 'Message', type: 'string', required: false },
      { id: 'image', name: 'Image', type: 'image', required: false },
      { id: 'video', name: 'Video', type: 'video', required: false },
      { id: 'link', name: 'Link', type: 'url', required: false },
      { id: 'location', name: 'Location', type: 'string', required: false },
      { id: 'tags', name: 'Tag Friends', type: 'array', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'postId', name: 'Post ID', type: 'string' },
      { id: 'postUrl', name: 'Post URL', type: 'url' },
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
  
  // Type Adapter/Translator Nodes
  'type-converter': {
    id: 'type-converter',
    name: 'Type Converter',
    icon: '🔄',
    color: '#F59E0B',
    description: 'Convert data from one type to another (explicit conversion)',
    category: 'action',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'input', name: 'Input', type: 'any', required: true },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'output', name: 'Output', type: 'any' },
    ],
  },
  'data-transformer': {
    id: 'data-transformer',
    name: 'Data Transformer',
    icon: '🔀',
    color: '#EC4899',
    description: 'Transform data structure (object to array, JSON parsing, etc.)',
    category: 'action',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'data', name: 'Data', type: 'any', required: true },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'transformed', name: 'Transformed', type: 'any' },
    ],
  },
  'format-converter': {
    id: 'format-converter',
    name: 'Format Converter',
    icon: '📄',
    color: '#10B981',
    description: 'Convert between formats (JSON to XML, etc.)',
    category: 'action',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'input', name: 'Input', type: 'json', required: true },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'output', name: 'Output', type: 'string' },
    ],
  },
  'validator': {
    id: 'validator',
    name: 'Validator',
    icon: '✓',
    color: '#16A34A',
    description: 'Validate data before passing to next node',
    category: 'action',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'data', name: 'Data', type: 'any', required: true },
      { id: 'rule', name: 'Validation Rule', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Valid', type: 'execution' },
      { id: 'invalid', name: 'Invalid', type: 'execution' },
      { id: 'validated', name: 'Validated Data', type: 'any' },
      { id: 'error', name: 'Error Message', type: 'string' },
    ],
  },
  'media-converter': {
    id: 'media-converter',
    name: 'Media Converter',
    icon: '🎞️',
    color: '#8B5CF6',
    description: 'Convert between media types (image to video, video to audio, etc.)',
    category: 'action',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'media', name: 'Media', type: 'any', required: true },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'converted', name: 'Converted Media', type: 'any' },
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




