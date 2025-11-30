// Utility to convert legacy 3D flowchart format to new Blueprint 2D format
import { FlowchartNode as LegacyNode, FlowchartConnection as LegacyConnection } from '../FlowchartCanvas';
import { BlueprintNode, BlueprintConnection, BlueprintFlowchartData } from '@/src/types/flowchart';
import { getNodeType } from '../NodeTypes';

export function convertLegacyToBlueprint(
  nodes: LegacyNode[],
  connections: LegacyConnection[]
): BlueprintFlowchartData {
  // Convert nodes
  const blueprintNodes: BlueprintNode[] = nodes.map((node) => {
    const nodeType = getNodeType(node.type);
    return {
      id: node.id,
      type: node.type,
      position: [node.position[0] * 100, node.position[2] * 100], // Convert 3D to 2D
      label: node.label,
      data: node.data,
      inputPins: nodeType?.inputPins || [],
      outputPins: nodeType?.outputPins || [],
    };
  });

  // Convert connections
  const blueprintConnections: BlueprintConnection[] = connections.map((conn, index) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);

    // For legacy connections without pins, create default connections
    return {
      id: conn.id || `conn-${index}`,
      fromNodeId: conn.from,
      fromPinId: 'exec', // Default to execution pin
      toNodeId: conn.to,
      toPinId: 'exec', // Default to execution pin
      type: 'execution',
    };
  });

  return {
    nodes: blueprintNodes,
    connections: blueprintConnections,
    variables: [],
    comments: [],
    viewport: {
      zoom: 1,
      panX: 0,
      panY: 0,
    },
  };
}

