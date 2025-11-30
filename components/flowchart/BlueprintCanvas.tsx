'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BlueprintNode, BlueprintConnection } from '@/src/types/flowchart';
import { ViewportState } from '@/src/types/flowchart';
import GridBackground, { snapToGrid } from './GridBackground';
import BlueprintNodeComponent from './BlueprintNode';
import BlueprintConnections from './BlueprintConnections';
import { FlowchartNodeType, getNodeType } from './NodeTypes';
import { screenToWorld, worldToScreen, bezierPath } from './utils/canvasUtils';
import { validateConnection, canConnect } from './utils/typeCompatibility';
import { PinType } from '@/src/types/flowchart';

interface BlueprintCanvasProps {
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onNodePositionChange: (nodeId: string, position: [number, number]) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionCreate?: (fromNodeId: string, fromPinId: string, toNodeId: string, toPinId: string) => void;
  onConnectionDelete?: (connectionId: string) => void;
  snapToGridEnabled?: boolean;
  gridSize?: number;
}

const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const DEFAULT_PAN_X = 0;
const DEFAULT_PAN_Y = 0;
const DEFAULT_GRID_SIZE = 20;

export default function BlueprintCanvas({
  nodes,
  connections,
  selectedNodeId,
  onNodeClick,
  onNodePositionChange,
  onNodeDelete,
  onConnectionCreate,
  onConnectionDelete,
  snapToGridEnabled = true,
  gridSize = DEFAULT_GRID_SIZE,
}: BlueprintCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: DEFAULT_ZOOM,
    panX: DEFAULT_PAN_X,
    panY: DEFAULT_PAN_Y,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [hoveredPinInfo, setHoveredPinInfo] = useState<{ nodeId: string; pinId: string; type: PinType; direction: 'input' | 'output' } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; pinId: string; pinType: PinType; x: number; y: number } | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);
  const [connectionValidation, setConnectionValidation] = useState<{ valid: boolean; message?: string; requiresAdapter?: boolean } | null>(null);

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle mouse or Shift+Left
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (e.button === 0) {
      // Left click on canvas - deselect
      if (e.target === e.currentTarget) {
        onNodeClick('');
      }
    }
  }, [onNodeClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStart) {
      const dx = (e.clientX - panStart.x) / viewport.zoom;
      const dy = (e.clientY - panStart.y) / viewport.zoom;
      setViewport(prev => ({
        ...prev,
        panX: prev.panX - dx,
        panY: prev.panY - dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }

    // Update connection preview
    if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const worldPos = screenToWorld(
          { x: e.clientX - rect.left, y: e.clientY - rect.top },
          viewport,
          canvasSize
        );
        setConnectionPreview({ x: worldPos.x, y: worldPos.y });
      }
    }
  }, [isPanning, panStart, viewport, connectingFrom, canvasSize]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * delta));
    setViewport(prev => ({ ...prev, zoom: newZoom }));
  }, [viewport.zoom]);

  // Handle pin click for connections with type validation
  const handlePinClick = useCallback((nodeId: string, pinId: string, direction: 'input' | 'output') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const nodeType = getNodeType(node.type);
    if (!nodeType) return;

    const pins = direction === 'input' ? node.inputPins : node.outputPins;
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;

    if (connectingFrom) {
      // Completing connection - validate types
      if (connectingFrom.nodeId !== nodeId && direction === 'input') {
        // Can only connect output to input
        const validation = validateConnection(connectingFrom.pinType, pin.type, pin.type === 'execution' ? 'execution' : 'data');
        
        if (validation.valid) {
          // Connection is valid
          onConnectionCreate?.(connectingFrom.nodeId, connectingFrom.pinId, nodeId, pinId);
          setConnectionValidation(null);
        } else {
          // Show error message
          setConnectionValidation({
            valid: false,
            message: validation.errorMessage || `Cannot connect ${connectingFrom.pinType} to ${pin.type}`,
            requiresAdapter: validation.requiresAdapter,
          });
          // Auto-clear error after 3 seconds
          setTimeout(() => setConnectionValidation(null), 3000);
        }
      }
      setConnectingFrom(null);
      setConnectionPreview(null);
    } else if (direction === 'output') {
      // Starting connection from output pin
      const pinX = direction === 'output' ? node.position[0] + 200 : node.position[0];
      const pinIndex = pins.findIndex(p => p.id === pinId);
      const pinY = node.position[1] + 40 + pinIndex * 24;
      setConnectingFrom({ nodeId, pinId, pinType: pin.type, x: pinX, y: pinY });
      setConnectionValidation(null);
    }
  }, [nodes, connectingFrom, onConnectionCreate]);
  
  // Handle pin hover for connection preview validation
  const handlePinHover = useCallback((nodeId: string, pinId: string, direction: 'input' | 'output', type: PinType) => {
    setHoveredPinInfo({ nodeId, pinId, type, direction });
    
    if (connectingFrom && direction === 'input') {
      // Validate connection while hovering
      const validation = validateConnection(connectingFrom.pinType, type, type === 'execution' ? 'execution' : 'data');
      setConnectionValidation(validation);
    } else {
      setConnectionValidation(null);
    }
  }, [connectingFrom]);
  
  const handlePinLeave = useCallback(() => {
    setHoveredPinInfo(null);
    if (!connectingFrom) {
      setConnectionValidation(null);
    }
  }, [connectingFrom]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          onNodeDelete(selectedNodeId);
        }
      } else if (e.key === 'Escape') {
        setConnectingFrom(null);
        setConnectionPreview(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, onNodeDelete]);

  // Calculate connection positions
  const connectionsWithPositions = connections.map(conn => {
    const fromNode = nodes.find(n => n.id === conn.fromNodeId);
    const toNode = nodes.find(n => n.id === conn.toNodeId);
    
    if (!fromNode || !toNode) return null;

    const fromNodeType = getNodeType(fromNode.type);
    const toNodeType = getNodeType(toNode.type);
    if (!fromNodeType || !toNodeType) return null;

    const fromPins = fromNode.outputPins || fromNodeType.outputPins || [];
    const toPins = toNode.inputPins || toNodeType.inputPins || [];

    const fromPinIndex = fromPins.findIndex(p => p.id === conn.fromPinId);
    const toPinIndex = toPins.findIndex(p => p.id === conn.toPinId);

    if (fromPinIndex === -1 || toPinIndex === -1) return null;

    return {
      ...conn,
      fromPosition: [
        fromNode.position[0] + 200,
        fromNode.position[1] + 40 + fromPinIndex * 24,
      ] as [number, number],
      toPosition: [
        toNode.position[0],
        toNode.position[1] + 40 + toPinIndex * 24,
      ] as [number, number],
    };
  }).filter((conn): conn is BlueprintConnection & { fromPosition: [number, number]; toPosition: [number, number] } => conn !== null);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-[#1a1a1a]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Grid Background */}
      <GridBackground
        width={canvasSize.width}
        height={canvasSize.height}
        gridSize={gridSize}
        zoom={viewport.zoom}
        panX={viewport.panX}
        panY={viewport.panY}
        snapToGrid={snapToGridEnabled}
      />

      {/* SVG layer for connections */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <BlueprintConnections
          connections={connectionsWithPositions}
          connectingFrom={connectingFrom}
          connectionPreview={connectionPreview}
        />
      </svg>

      {/* Nodes layer */}
      <div
        className="absolute"
        style={{
          transform: `translate(${canvasSize.width / 2}px, ${canvasSize.height / 2}px)`,
          transformOrigin: 'center center',
        }}
      >
        {nodes.map((node) => {
          const nodeType = getNodeType(node.type);
          if (!nodeType) return null;

          // Transform node position based on viewport
          const screenPos = worldToScreen(
            { x: node.position[0], y: node.position[1] },
            viewport,
            canvasSize
          );

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: screenPos.x,
                top: screenPos.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <BlueprintNodeComponent
                node={node}
                nodeType={nodeType}
                isSelected={selectedNodeId === node.id}
                zoom={viewport.zoom}
                onClick={() => onNodeClick(node.id)}
                onPositionChange={(id, position) => {
                  // Convert screen position back to world
                  const worldPos = screenToWorld(
                    { x: position[0], y: position[1] },
                    viewport,
                    canvasSize
                  );
                  const finalPosition = snapToGridEnabled
                    ? snapToGrid(worldPos.x, worldPos.y, gridSize)
                    : [worldPos.x, worldPos.y];
                  onNodePositionChange(id, finalPosition as [number, number]);
                }}
                onDelete={onNodeDelete}
                onPinClick={handlePinClick}
                onPinHover={(nodeId, pinId) => setHoveredPinId(pinId)}
                hoveredPinId={hoveredPinId}
              />
            </div>
          );
        })}
      </div>

      {/* Connection Validation Tooltip */}
      {connectionValidation && connectingFrom && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: connectingFrom.x + 10,
            top: connectingFrom.y + 10,
          }}
        >
          <div
            className={`px-3 py-2 rounded-lg text-sm font-medium shadow-lg ${
              connectionValidation.valid
                ? 'bg-green-600 text-white'
                : connectionValidation.requiresAdapter
                ? 'bg-yellow-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {connectionValidation.valid ? (
              <span>✓ Valid Connection</span>
            ) : connectionValidation.requiresAdapter ? (
              <div>
                <div>⚠ Needs Adapter Node</div>
                {connectionValidation.message && (
                  <div className="text-xs mt-1">{connectionValidation.message}</div>
                )}
              </div>
            ) : (
              <div>
                <div>✗ Invalid Connection</div>
                {connectionValidation.message && (
                  <div className="text-xs mt-1">{connectionValidation.message}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm pointer-events-none">
        Zoom: {(viewport.zoom * 100).toFixed(0)}% • Shift+Drag to pan • Click pin to connect
      </div>
    </div>
  );
}

