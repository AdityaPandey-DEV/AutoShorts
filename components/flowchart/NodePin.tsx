'use client';

import { PinType } from '@/src/types/flowchart';
import { useMemo } from 'react';

interface NodePinProps {
  id: string;
  name: string;
  type: PinType;
  direction: 'input' | 'output';
  x: number;
  y: number;
  connected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const PIN_COLORS: Record<PinType, string> = {
  execution: '#4A90E2',
  string: '#E8A87C',
  number: '#41B3A3',
  boolean: '#C38D9E',
  object: '#F4A261',
  array: '#E76F51',
  any: '#95A5A6',
};

const PIN_SHAPES: Record<PinType, 'circle' | 'square'> = {
  execution: 'square',
  string: 'circle',
  number: 'circle',
  boolean: 'circle',
  object: 'circle',
  array: 'circle',
  any: 'circle',
};

export default function NodePin({
  id,
  name,
  type,
  direction,
  x,
  y,
  connected = false,
  hovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: NodePinProps) {
  const color = PIN_COLORS[type] || PIN_COLORS.any;
  const shape = PIN_SHAPES[type];
  const size = 8;
  const radius = shape === 'circle' ? size / 2 : size / 4;

  const pinStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: direction === 'input' ? -size / 2 : `calc(100% - ${size / 2}px)`,
    top: y,
    transform: 'translateY(-50%)',
    width: size,
    height: size,
    cursor: 'crosshair',
    zIndex: 10,
  }), [direction, y, size]);

  return (
    <div
      style={pinStyle}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
        onMouseEnter?.();
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        onMouseLeave?.();
      }}
      className="group"
    >
      {/* Pin visual */}
      <svg
        width={size + 4}
        height={size + 4}
        style={{
          position: 'absolute',
          left: -2,
          top: -2,
        }}
      >
        {shape === 'circle' ? (
          <circle
            cx={(size + 4) / 2}
            cy={(size + 4) / 2}
            r={radius}
            fill={connected ? color : hovered ? color : '#666'}
            stroke={hovered || connected ? '#fff' : '#888'}
            strokeWidth={hovered || connected ? 2 : 1}
            className="transition-all duration-150"
          />
        ) : (
          <rect
            x={2}
            y={2}
            width={size}
            height={size}
            fill={connected ? color : hovered ? color : '#666'}
            stroke={hovered || connected ? '#fff' : '#888'}
            strokeWidth={hovered || connected ? 2 : 1}
            className="transition-all duration-150"
          />
        )}
      </svg>

      {/* Label */}
      <span
        className="absolute text-xs text-gray-300 whitespace-nowrap pointer-events-none select-none"
        style={{
          left: direction === 'input' ? size + 6 : 'auto',
          right: direction === 'output' ? size + 6 : 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: hovered ? 1 : 0.7,
        }}
      >
        {name}
      </span>

      {/* Connection indicator line */}
      {connected && (
        <div
          className="absolute bg-blue-500"
          style={{
            left: direction === 'input' ? 0 : '100%',
            top: '50%',
            width: direction === 'input' ? 4 : 8,
            height: 2,
            transform: 'translateY(-50%)',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
}

