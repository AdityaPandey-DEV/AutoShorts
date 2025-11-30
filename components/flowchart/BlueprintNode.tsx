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
  const [dragStart, setDragStart] = useState<{ x: number; y: number; worldX: number; worldY: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const DRAG_THRESHOLD = 5; // Minimum pixels to move before considering it a drag

  const inputPins = node.inputPins || nodeType.inputPins || [];
  const outputPins = node.outputPins || nodeType.outputPins || [];

  // Calculate node height based on pins
  const nodeHeight = Math.max(
    NODE_HEADER_HEIGHT + Math.max(inputPins.length, outputPins.length) * PIN_SPACING + 20,
    80
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      e.stopPropagation();
      // Store the initial mouse position in screen coordinates AND the node's current world position
      const canvasElement = e.currentTarget.closest('[data-canvas-container]');
      if (canvasElement) {
        const canvasRect = canvasElement.getBoundingClientRect();
        setDragStart({
          x: e.clientX - canvasRect.left,
          y: e.clientY - canvasRect.top,
          worldX: node.position[0], // Store current world position
          worldY: node.position[1],
        });
        setHasMoved(false);
        setIsDragging(true);
      }
      onClick();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // This is handled by global mouse move in useEffect
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDragging && dragStart) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // Get canvas container to calculate screen coordinates
        if (nodeRef.current) {
          const canvasElement = nodeRef.current.closest('[data-canvas-container]');
          if (canvasElement) {
            const canvasRect = canvasElement.getBoundingClientRect();
            const currentScreenX = e.clientX - canvasRect.left;
            const currentScreenY = e.clientY - canvasRect.top;
            
            // Calculate delta from drag start in screen coordinates
            const deltaScreenX = currentScreenX - dragStart.x;
            const deltaScreenY = currentScreenY - dragStart.y;
            
            // Check if mouse has moved enough to be considered a drag
            const distance = Math.sqrt(deltaScreenX * deltaScreenX + deltaScreenY * deltaScreenY);
            if (distance < DRAG_THRESHOLD) {
              return; // Don't update position if movement is too small (just a click)
            }
            
            setHasMoved(true);
            
            // Convert screen delta to world delta (accounting for zoom)
            // Since zoom affects the scale, we need to divide by zoom to get world delta
            const deltaWorldX = deltaScreenX / zoom;
            const deltaWorldY = deltaScreenY / zoom;
            
            // Calculate new world position by adding delta to original world position
            const newWorldX = dragStart.worldX + deltaWorldX;
            const newWorldY = dragStart.worldY + deltaWorldY;
            
            // Pass the new world position to parent
            onPositionChange(node.id, [newWorldX, newWorldY]);
          }
        }
      };

      const handleGlobalMouseUp = () => {
        // Only trigger click if we didn't actually drag
        if (!hasMoved) {
          // This was just a click, not a drag
        }
        setIsDragging(false);
        setDragStart(null);
        setHasMoved(false);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, node.id, node.position, zoom, onPositionChange, hasMoved]);

  // Calculate pin positions
  const getPinY = (index: number) => PIN_START_Y + index * PIN_SPACING;

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-move transition-shadow duration-200 ${
        isSelected ? 'shadow-lg shadow-blue-500/50' : 'shadow-md'
      }`}
      style={{
        left: 0,
        top: 0,
        width: node.width || NODE_WIDTH,
        minHeight: nodeHeight,
        transform: `scale(${Math.max(0.5, Math.min(2, zoom))})`,
        transformOrigin: 'center center',
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

