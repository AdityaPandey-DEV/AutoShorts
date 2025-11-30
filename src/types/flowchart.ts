// Blueprint-style flowchart type definitions

export type PinType = 'execution' | 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
export type ConnectionType = 'execution' | 'data';

export interface Pin {
  id: string;
  nodeId: string;
  name: string;
  type: PinType;
  direction: 'input' | 'output';
  connected?: boolean;
  value?: any;
  required?: boolean;
}

export interface NodePin {
  id: string;
  name: string;
  type: PinType;
  defaultValue?: any;
  required?: boolean;
}

export interface BlueprintNode {
  id: string;
  type: string;
  position: [number, number]; // 2D position [x, y]
  label?: string;
  data?: Record<string, any>;
  inputPins: NodePin[];
  outputPins: NodePin[];
  width?: number;
  height?: number;
  collapsed?: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface BlueprintConnection {
  id: string;
  fromNodeId: string;
  fromPinId: string;
  toNodeId: string;
  toPinId: string;
  type: ConnectionType;
  // Calculated positions for rendering
  fromPosition?: [number, number];
  toPosition?: [number, number];
}

export interface FlowchartVariable {
  id: string;
  name: string;
  type: PinType;
  defaultValue?: any;
  description?: string;
}

export interface CommentBox {
  id: string;
  position: [number, number];
  size: [number, number];
  text: string;
  color?: string;
  nodeIds?: string[]; // Nodes within this comment box
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface BlueprintFlowchartData {
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  variables: FlowchartVariable[];
  comments: CommentBox[];
  viewport?: ViewportState;
}

// Legacy 3D types for compatibility
export interface FlowchartNode {
  id: string;
  type: string;
  position: [number, number, number];
  label?: string;
  data?: any;
}

export interface FlowchartConnection {
  id: string;
  from: string;
  to: string;
  fromPosition?: [number, number, number];
  toPosition?: [number, number, number];
}

