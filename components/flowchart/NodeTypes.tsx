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
  'youtube-upload': {
    id: 'youtube-upload',
    name: 'YouTube Upload',
    icon: '📺',
    color: '#16A34A',
    description: 'Uploads video to YouTube channel',
    category: 'output',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'video', name: 'Video', type: 'object', required: true },
      { id: 'title', name: 'Title', type: 'string', required: false },
      { id: 'description', name: 'Description', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'videoId', name: 'Video ID', type: 'string' },
    ],
  },
  'feedback-loop': {
    id: 'feedback-loop',
    name: 'Feedback Loop',
    icon: '📊',
    color: '#16A34A',
    description: 'Monitors performance and learns from feedback',
    category: 'process',
    configurable: true,
    inputPins: [
      { id: 'exec', name: 'Exec', type: 'execution' },
      { id: 'videoId', name: 'Video ID', type: 'string', required: false },
    ],
    outputPins: [
      { id: 'exec', name: 'Then', type: 'execution' },
      { id: 'metrics', name: 'Metrics', type: 'object' },
    ],
  },
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
};

export const NODE_TYPES_ARRAY = Object.values(NODE_TYPES);

export function getNodeType(id: string): FlowchartNodeType | null {
  return NODE_TYPES[id] || null;
}




