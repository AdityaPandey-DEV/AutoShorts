// Blueprint-style flowchart type definitions

// Base types
export type BasicPinType = 'execution' | 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
export type MediaPinType = 'image' | 'video' | 'audio';
export type StructuredPinType = 'json' | 'url' | 'date' | 'filepath';

// Extended PinType that supports custom user-defined types
export type PinType = BasicPinType | MediaPinType | StructuredPinType | string; // string = custom type

export type ConnectionType = 'execution' | 'data';

// Type compatibility and conversion
export interface TypeConversionRule {
  from: PinType;
  to: PinType;
  automatic: boolean;
  converter?: (value: any) => any;
  requiresAdapter: boolean;
}

export interface CustomTypeDefinition {
  id: string;
  name: string;
  baseType: BasicPinType | MediaPinType | StructuredPinType;
  schema?: Record<string, any>; // JSON schema for validation
  description?: string;
}

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
  description?: string; // Help text for the pin
  customTypeId?: string; // If using a custom type, reference it here
}

export interface BlueprintNode {
  id: string;
  type: string;
  position: [number, number]; // 2D position [x, y]
  label?: string;
  data?: Record<string, any>; // Can contain customPins, configuration, etc.
  inputPins: NodePin[];
  outputPins: NodePin[];
  width?: number;
  height?: number;
  collapsed?: boolean;
  errors?: string[];
  warnings?: string[];
  // For configurable nodes (AI, Social Media, etc.)
  customInputPins?: NodePin[]; // User-added custom input pins
  customOutputPins?: NodePin[]; // User-added custom output pins
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
  // Type conversion metadata
  fromType?: PinType;
  toType?: PinType;
  requiresConversion?: boolean;
  converterId?: string; // If using an adapter node, reference it
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
  customTypes?: CustomTypeDefinition[]; // User-defined custom types
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

