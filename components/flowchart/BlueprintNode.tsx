'use client';

import { useState, useRef, useEffect } from 'react';
import { BlueprintNode as BlueprintNodeType, PinType } from '@/src/types/flowchart';
import { FlowchartNodeType, getNodeType } from './NodeTypes';
import NodePin from './NodePin';

interface BlueprintNodeProps {
  node: BlueprintNodeType;
  nodeType: FlowchartNodeType;
  isSelected: boolean;
  zoom: number;
  onClick: () => void;
  onPositionChange: (id: string, position: [number, number]) => void;
  onDelete: (id: string) => void;
  onPinClick: (nodeId: string, pinId: string, direction: 'input' | 'output') => void;
  onPinHover?: (nodeId: string, pinId: string | null) => void;
  hoveredPinId?: string | null;
}

const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 32;
const PIN_SPACING = 24;
const PIN_START_Y = 40;

export default function BlueprintNode({
  node,
  nodeType,
  isSelected,
  zoom,
  onClick,
  onPositionChange,
  onDelete,
  onPinClick,
  onPinHover,
  hoveredPinId,
}: BlueprintNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const inputPins = node.inputPins || nodeType.inputPins || [];
  const outputPins = node.outputPins || nodeType.outputPins || [];

  // Calculate node height based on pins
  const nodeHeight = Math.max(
    NODE_HEADER_HEIGHT + Math.max(inputPins.length, outputPins.length) * PIN_SPACING + 20,
    80
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({
        x: e.clientX - node.position[0],
        y: e.clientY - node.position[1],
      });
      onClick();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onPositionChange(node.id, [newX, newY]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (dragStart) {
          const newX = e.clientX - dragStart.x;
          const newY = e.clientY - dragStart.y;
          onPositionChange(node.id, [newX, newY]);
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, node.id, onPositionChange]);

  // Calculate pin positions
  const getPinY = (index: number) => PIN_START_Y + index * PIN_SPACING;

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-move transition-shadow duration-200 ${
        isSelected ? 'shadow-lg shadow-blue-500/50' : 'shadow-md'
      }`}
      style={{
        left: node.position[0],
        top: node.position[1],
        width: node.width || NODE_WIDTH,
        minHeight: nodeHeight,
        transform: `scale(${Math.max(0.5, Math.min(2, zoom))})`,
        transformOrigin: 'top left',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Node background */}
      <div
        className="relative rounded-lg border-2 overflow-hidden"
        style={{
          backgroundColor: '#2a2a2a',
          borderColor: isSelected ? nodeType.color : '#444',
          minHeight: nodeHeight,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            backgroundColor: nodeType.color + '20',
            borderBottom: `1px solid ${nodeType.color}40`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{nodeType.icon}</span>
            <span className="text-sm font-semibold text-white">{node.label || nodeType.name}</span>
          </div>
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              className="text-red-400 hover:text-red-300 text-xs px-1"
              title="Delete"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="relative" style={{ minHeight: nodeHeight - NODE_HEADER_HEIGHT }}>
          {/* Input pins */}
          {inputPins.map((pin, index) => {
            const pinId = pin.id;
            const isHovered = hoveredPinId === `${node.id}-${pinId}-input`;
            const pinY = getPinY(index);

            return (
              <NodePin
                key={`input-${pinId}`}
                id={`${node.id}-${pinId}-input`}
                name={pin.name}
                type={pin.type}
                direction="input"
                x={0}
                y={pinY}
                connected={false} // TODO: Check if connected
                hovered={isHovered}
                onClick={() => onPinClick(node.id, pinId, 'input')}
                onMouseEnter={() => onPinHover?.(node.id, `${node.id}-${pinId}-input`)}
                onMouseLeave={() => onPinHover?.(node.id, null)}
              />
            );
          })}

          {/* Output pins */}
          {outputPins.map((pin, index) => {
            const pinId = pin.id;
            const isHovered = hoveredPinId === `${node.id}-${pinId}-output`;
            const pinY = getPinY(index);

            return (
              <NodePin
                key={`output-${pinId}`}
                id={`${node.id}-${pinId}-output`}
                name={pin.name}
                type={pin.type}
                direction="output"
                x={NODE_WIDTH}
                y={pinY}
                connected={false} // TODO: Check if connected
                hovered={isHovered}
                onClick={() => onPinClick(node.id, pinId, 'output')}
                onMouseEnter={() => onPinHover?.(node.id, `${node.id}-${pinId}-output`)}
                onMouseLeave={() => onPinHover?.(node.id, null)}
              />
            );
          })}
        </div>

        {/* Error/Warning indicators */}
        {(node.errors && node.errors.length > 0) && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-900/50 text-red-200 text-xs px-2 py-1">
            ⚠ {node.errors[0]}
          </div>
        )}
        {(node.warnings && node.warnings.length > 0) && (
          <div className="absolute bottom-0 left-0 right-0 bg-yellow-900/50 text-yellow-200 text-xs px-2 py-1">
            ⚠ {node.warnings[0]}
          </div>
        )}
      </div>
    </div>
  );
}

