export interface FlowchartNodeType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  category: 'input' | 'process' | 'output' | 'condition' | 'action';
  configurable?: boolean;
}

export const NODE_TYPES: Record<string, FlowchartNodeType> = {
  'ai-thinking': {
    id: 'ai-thinking',
    name: 'AI Thinking',
    icon: '🧠',
    color: '#DC2626',
    description: 'AI analyzes trends and generates content ideas',
    category: 'process',
    configurable: true,
  },
  'video-creator': {
    id: 'video-creator',
    name: 'Video Creator',
    icon: '🎬',
    color: '#DC2626',
    description: 'Creates video content with visuals and narration',
    category: 'process',
    configurable: true,
  },
  'youtube-upload': {
    id: 'youtube-upload',
    name: 'YouTube Upload',
    icon: '📺',
    color: '#16A34A',
    description: 'Uploads video to YouTube channel',
    category: 'output',
    configurable: true,
  },
  'feedback-loop': {
    id: 'feedback-loop',
    name: 'Feedback Loop',
    icon: '📊',
    color: '#16A34A',
    description: 'Monitors performance and learns from feedback',
    category: 'process',
    configurable: true,
  },
  'condition': {
    id: 'condition',
    name: 'Condition',
    icon: '❓',
    color: '#F59E0B',
    description: 'Decision point based on conditions',
    category: 'condition',
    configurable: true,
  },
  'delay': {
    id: 'delay',
    name: 'Delay',
    icon: '⏱️',
    color: '#6366F1',
    description: 'Wait for specified time before next step',
    category: 'action',
    configurable: true,
  },
  'trigger': {
    id: 'trigger',
    name: 'Trigger',
    icon: '⚡',
    color: '#8B5CF6',
    description: 'Starting point of the automation',
    category: 'input',
    configurable: false,
  },
};

export const NODE_TYPES_ARRAY = Object.values(NODE_TYPES);

export function getNodeType(id: string): FlowchartNodeType | null {
  return NODE_TYPES[id] || null;
}

