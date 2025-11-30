'use client';

import { useMemo } from 'react';
import { BlueprintNode, BlueprintConnection } from '@/src/types/flowchart';
import { ViewportState } from '@/src/types/flowchart';

interface MinimapProps {
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  viewport: ViewportState;
  canvasSize: { width: number; height: number };
  onViewportChange: (viewport: ViewportState) => void;
}

const MINIMAP_SIZE = 200;
const MINIMAP_SCALE = 0.1;

export default function Minimap({
  nodes,
  connections,
  viewport,
  canvasSize,
  onViewportChange,
}: MinimapProps) {
  // Calculate bounds of all nodes
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.position[0]);
      minY = Math.min(minY, node.position[1]);
      maxX = Math.max(maxX, node.position[0] + (node.width || 200));
      maxY = Math.max(maxY, node.position[1] + 100);
    });

    // Add padding
    const padding = 200;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [nodes]);

  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;

  // Calculate viewport rectangle on minimap
  const viewportRect = useMemo(() => {
    const visibleWidth = canvasSize.width / viewport.zoom;
    const visibleHeight = canvasSize.height / viewport.zoom;

    const viewportMinX = viewport.panX - visibleWidth / 2;
    const viewportMinY = viewport.panY - visibleHeight / 2;

    const scale = MINIMAP_SIZE / Math.max(boundsWidth, boundsHeight);

    return {
      x: ((viewportMinX - bounds.minX) * scale),
      y: ((viewportMinY - bounds.minY) * scale),
      width: visibleWidth * scale,
      height: visibleHeight * scale,
    };
  }, [viewport, bounds, canvasSize, boundsWidth, boundsHeight]);

  const handleMinimapClick = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / MINIMAP_SIZE;
    const y = (e.clientY - rect.top) / MINIMAP_SIZE;

    const worldX = bounds.minX + x * boundsWidth;
    const worldY = bounds.minY + y * boundsHeight;

    onViewportChange({
      ...viewport,
      panX: worldX,
      panY: worldY,
    });
  };

  const scale = MINIMAP_SIZE / Math.max(boundsWidth, boundsHeight);

  return (
    <div className="absolute bottom-4 right-4 bg-[#2a2a2a] border border-gray-600 rounded-lg p-2 shadow-lg">
      <div className="text-xs text-gray-400 mb-1 text-center">Minimap</div>
      <svg
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        className="border border-gray-600 rounded"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        {/* Draw nodes as dots */}
        {nodes.map((node) => {
          const x = (node.position[0] - bounds.minX) * scale;
          const y = (node.position[1] - bounds.minY) * scale;
          return (
            <circle
              key={node.id}
              cx={x}
              cy={y}
              r={3}
              fill="#4A90E2"
              opacity="0.7"
            />
          );
        })}

        {/* Draw connections as lines */}
        {connections.map((conn) => {
          const fromNode = nodes.find(n => n.id === conn.fromNodeId);
          const toNode = nodes.find(n => n.id === conn.toNodeId);
          if (!fromNode || !toNode) return null;

          const x1 = (fromNode.position[0] - bounds.minX) * scale;
          const y1 = (fromNode.position[1] - bounds.minY) * scale;
          const x2 = (toNode.position[0] - bounds.minX) * scale;
          const y2 = (toNode.position[1] - bounds.minY) * scale;

          return (
            <line
              key={conn.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#4A90E2"
              strokeWidth="1"
              opacity="0.3"
            />
          );
        })}

        {/* Viewport rectangle */}
        <rect
          x={viewportRect.x}
          y={viewportRect.y}
          width={viewportRect.width}
          height={viewportRect.height}
          fill="none"
          stroke="#FFA500"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Clickable background */}
        <rect
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          fill="transparent"
          onClick={handleMinimapClick}
          className="cursor-pointer"
        />
      </svg>
    </div>
  );
}

