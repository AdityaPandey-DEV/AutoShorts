'use client';

import { useMemo } from 'react';

interface GridBackgroundProps {
  width: number;
  height: number;
  gridSize: number;
  zoom: number;
  panX: number;
  panY: number;
  snapToGrid?: boolean;
}

export default function GridBackground({
  width,
  height,
  gridSize,
  zoom,
  panX,
  panY,
  snapToGrid = true,
}: GridBackgroundProps) {
  const patternId = 'grid-pattern';

  // Adjust grid size based on zoom level
  const effectiveGridSize = useMemo(() => {
    if (zoom >= 1) return gridSize;
    if (zoom >= 0.5) return gridSize * 2;
    if (zoom >= 0.25) return gridSize * 4;
    return gridSize * 8;
  }, [zoom, gridSize]);

  // Calculate pattern offset for smooth panning
  const offsetX = (panX % effectiveGridSize) * zoom;
  const offsetY = (panY % effectiveGridSize) * zoom;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{
        background: '#1a1a1a',
      }}
    >
      <defs>
        <pattern
          id={patternId}
          x={offsetX}
          y={offsetY}
          width={effectiveGridSize * zoom}
          height={effectiveGridSize * zoom}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${effectiveGridSize * zoom} 0 L 0 0 0 ${effectiveGridSize * zoom}`}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

// Helper function to snap coordinates to grid
export function snapToGrid(x: number, y: number, gridSize: number): [number, number] {
  return [
    Math.round(x / gridSize) * gridSize,
    Math.round(y / gridSize) * gridSize,
  ];
}

