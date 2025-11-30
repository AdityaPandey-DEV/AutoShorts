'use client';

import { BlueprintConnection, PinType } from '@/src/types/flowchart';
import { bezierPath } from './utils/canvasUtils';

interface BlueprintConnectionsProps {
  connections: Array<BlueprintConnection & { fromPosition: [number, number]; toPosition: [number, number] }>;
  connectingFrom?: { nodeId: string; pinId: string; x: number; y: number } | null;
  connectionPreview?: { x: number; y: number } | null;
}

const CONNECTION_COLORS: Record<PinType, string> = {
  execution: '#4A90E2',
  string: '#E8A87C',
  number: '#41B3A3',
  boolean: '#C38D9E',
  object: '#F4A261',
  array: '#E76F51',
  any: '#95A5A6',
};

export default function BlueprintConnections({
  connections,
  connectingFrom,
  connectionPreview,
}: BlueprintConnectionsProps) {
  return (
    <>
      {/* Existing connections */}
      {connections.map((conn) => {
        const path = bezierPath(
          { x: conn.fromPosition[0], y: conn.fromPosition[1] },
          { x: conn.toPosition[0], y: conn.toPosition[1] }
        );

        // Determine color based on connection type
        const color = CONNECTION_COLORS[conn.type === 'execution' ? 'execution' : 'any'];

        return (
          <g key={conn.id}>
            {/* Connection line */}
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray={conn.type === 'execution' ? 'none' : '5,5'}
              className="transition-all duration-200"
            />
            {/* Arrow head */}
            <defs>
              <marker
                id={`arrowhead-${conn.id}`}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill={color}
                />
              </marker>
            </defs>
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth="2"
              markerEnd={`url(#arrowhead-${conn.id})`}
              opacity="0"
            />
          </g>
        );
      })}

      {/* Connection preview (being drawn) */}
      {connectingFrom && connectionPreview && (
        <>
          <path
            d={bezierPath(
              { x: connectingFrom.x, y: connectingFrom.y },
              { x: connectionPreview.x, y: connectionPreview.y }
            )}
            fill="none"
            stroke="#4A90E2"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.7"
          />
          <circle
            cx={connectionPreview.x}
            cy={connectionPreview.y}
            r="4"
            fill="#4A90E2"
            opacity="0.7"
          />
        </>
      )}
    </>
  );
}

