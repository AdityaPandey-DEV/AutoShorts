'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BlueprintNode, BlueprintConnection } from '@/src/types/flowchart';
import { ViewportState } from '@/src/types/flowchart';
import GridBackground, { snapToGrid } from './GridBackground';
import BlueprintNodeComponent from './BlueprintNode';
import BlueprintConnections from './BlueprintConnections';
import CanvasNavigationControls from './CanvasNavigationControls';
import { FlowchartNodeType, getNodeType } from './NodeTypes';
import { screenToWorld, worldToScreen, bezierPath } from './utils/canvasUtils';
import { validateConnection } from './utils/typeCompatibility';
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
  initialViewport?: ViewportState;
  onViewportChange?: (viewport: ViewportState) => void;
  onVariableDrop?: (variableId: string, variableName: string, variableType: string, position: [number, number]) => void;
  onCanvasSizeChange?: (size: { width: number; height: number }) => void;
}

const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const DEFAULT_PAN_X = 0;
const DEFAULT_PAN_Y = 0;
const DEFAULT_GRID_SIZE = 20;
const PAN_STEP_SIZE = 50; // Pixels to pan per arrow key press
const ZOOM_STEP = 0.1; // Zoom increment/decrement

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
  initialViewport,
  onViewportChange,
  onVariableDrop,
  onCanvasSizeChange,
}: BlueprintCanvasProps) {
  // Wrapper for onNodeClick that also clears connection preview
  const handleNodeClickWithClear = useCallback((nodeId: string) => {
    onNodeClick(nodeId);
    // Clear connection preview when clicking on a node (not a pin)
    setConnectingFrom(null);
    setConnectionPreview(null);
  }, [onNodeClick]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportState>(
    initialViewport || {
      zoom: DEFAULT_ZOOM,
      panX: DEFAULT_PAN_X,
      panY: DEFAULT_PAN_Y,
    }
  );
  
  // Update viewport when initialViewport changes (e.g., from saved flowchart)
  useEffect(() => {
    if (initialViewport) {
      setViewport(initialViewport);
    }
  }, [initialViewport]);
  
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Notify parent of viewport changes
  useEffect(() => {
    onViewportChange?.(viewport);
  }, [viewport, onViewportChange]);

  // Notify parent of canvas size changes
  useEffect(() => {
    onCanvasSizeChange?.(canvasSize);
  }, [canvasSize, onCanvasSizeChange]);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
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
      // Left click on canvas - deselect and clear connection preview
      if (e.target === e.currentTarget) {
        handleNodeClickWithClear('');
      }
    }
  }, [handleNodeClickWithClear]);

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

    // Update connection preview (in screen coordinates for SVG)
    if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Get mouse position relative to canvas
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setConnectionPreview({ x: mouseX, y: mouseY });
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

  // Handle drag and drop for variables
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Check if this is a variable drop
    const variableData = e.dataTransfer.getData('application/variable');
    if (variableData && onVariableDrop) {
      try {
        const variable = JSON.parse(variableData);
        
        // Calculate drop position in world coordinates
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
          const screenX = e.clientX - canvasRect.left;
          const screenY = e.clientY - canvasRect.top;
          const worldPos = screenToWorld(
            { x: screenX, y: screenY },
            viewport,
            canvasSize
          );
          
          const finalPosition = snapToGridEnabled
            ? snapToGrid(worldPos.x, worldPos.y, gridSize)
            : [worldPos.x, worldPos.y];
          
          onVariableDrop(
            variable.id,
            variable.name,
            variable.type,
            finalPosition as [number, number]
          );
        }
      } catch (error) {
        console.error('Error parsing variable drop data:', error);
      }
    }
  }, [onVariableDrop, viewport, canvasSize, snapToGridEnabled, gridSize]);

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
      // Calculate pin position in screen coordinates
      const screenPos = worldToScreen(
        { x: node.position[0], y: node.position[1] },
        viewport,
        canvasSize
      );
      const pinIndex = pins.findIndex(p => p.id === pinId);
      const pinOffsetY = 40 + pinIndex * 24;
      const pinScreenX = screenPos.x + (200 * viewport.zoom); // Node width offset
      const pinScreenY = screenPos.y + (pinOffsetY * viewport.zoom);
      setConnectingFrom({ nodeId, pinId, pinType: pin.type, x: pinScreenX, y: pinScreenY });
      setConnectionValidation(null);
    }
  }, [nodes, connectingFrom, onConnectionCreate]);
  

  // Handle keyboard shortcuts and arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow key navigation for panning
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const step = PAN_STEP_SIZE / viewport.zoom; // Adjust step based on zoom level
        
        setViewport(prev => {
          let newPanX = prev.panX;
          let newPanY = prev.panY;
          
          switch (e.key) {
            case 'ArrowUp':
              newPanY -= step;
              break;
            case 'ArrowDown':
              newPanY += step;
              break;
            case 'ArrowLeft':
              newPanX -= step;
              break;
            case 'ArrowRight':
              newPanX += step;
              break;
          }
          
          return {
            ...prev,
            panX: newPanX,
            panY: newPanY,
          };
        });
        return;
      }

      // Zoom with +/- keys
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setViewport(prev => ({
          ...prev,
          zoom: Math.min(MAX_ZOOM, prev.zoom + ZOOM_STEP),
        }));
        return;
      }
      
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setViewport(prev => ({
          ...prev,
          zoom: Math.max(MIN_ZOOM, prev.zoom - ZOOM_STEP),
        }));
        return;
      }

      // Other keyboard shortcuts
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
  }, [selectedNodeId, onNodeDelete, viewport.zoom]);

  // Navigation handlers for mobile buttons
  const handlePan = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const step = PAN_STEP_SIZE / viewport.zoom;
    
    setViewport(prev => {
      let newPanX = prev.panX;
      let newPanY = prev.panY;
      
      switch (direction) {
        case 'up':
          newPanY -= step;
          break;
        case 'down':
          newPanY += step;
          break;
        case 'left':
          newPanX -= step;
          break;
        case 'right':
          newPanX += step;
          break;
      }
      
      return {
        ...prev,
        panX: newPanX,
        panY: newPanY,
      };
    });
  }, [viewport.zoom]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setViewport(prev => ({
      ...prev,
      zoom: direction === 'in' 
        ? Math.min(MAX_ZOOM, prev.zoom + ZOOM_STEP)
        : Math.max(MIN_ZOOM, prev.zoom - ZOOM_STEP),
    }));
  }, []);

  const handleReset = useCallback(() => {
    // Reset to center viewport
    setViewport({
      zoom: DEFAULT_ZOOM,
      panX: DEFAULT_PAN_X,
      panY: DEFAULT_PAN_Y,
    });
  }, []);

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

    // Convert node positions to screen coordinates for SVG rendering
    const fromScreenPos = worldToScreen(
      { x: fromNode.position[0], y: fromNode.position[1] },
      viewport,
      canvasSize
    );
    const toScreenPos = worldToScreen(
      { x: toNode.position[0], y: toNode.position[1] },
      viewport,
      canvasSize
    );

    // Calculate pin positions in screen space
    const pinOffsetY = 40 + fromPinIndex * 24;
    const toPinOffsetY = 40 + toPinIndex * 24;

    return {
      ...conn,
      fromPosition: [
        fromScreenPos.x + (200 * viewport.zoom), // Node width offset in screen space
        fromScreenPos.y + (pinOffsetY * viewport.zoom),
      ] as [number, number],
      toPosition: [
        toScreenPos.x,
        toScreenPos.y + (toPinOffsetY * viewport.zoom),
      ] as [number, number],
    };
  }).filter((conn): conn is BlueprintConnection & { fromPosition: [number, number]; toPosition: [number, number] } => conn !== null);

  return (
    <div
      ref={canvasRef}
      data-canvas-container
      className="relative w-full h-full overflow-hidden bg-[#1a1a1a]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
                zIndex: selectedNodeId === node.id ? 10 : 1,
              }}
            >
              <BlueprintNodeComponent
                node={node}
                nodeType={nodeType}
                isSelected={selectedNodeId === node.id}
                zoom={viewport.zoom}
                onClick={() => handleNodeClickWithClear(node.id)}
                onPositionChange={(id, position) => {
                  // Position is already in world coordinates (calculated as delta from original)
                  const finalPosition = snapToGridEnabled
                    ? snapToGrid(position[0], position[1], gridSize)
                    : [position[0], position[1]];
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
        Zoom: {(viewport.zoom * 100).toFixed(0)}% • Shift+Drag to pan • Arrow keys to navigate • Click pin to connect
      </div>

      {/* Navigation Controls (Mobile only) */}
      <CanvasNavigationControls
        onPan={handlePan}
        onZoom={handleZoom}
        onReset={handleReset}
        viewMode="2d"
      />
    </div>
  );
}

