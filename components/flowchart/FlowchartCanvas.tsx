'use client';

import { Suspense, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import EditableFlowchartNode from './EditableFlowchartNode';
import FlowchartConnections from '@/components/home/FlowchartConnections';
import CanvasNavigationControls from './CanvasNavigationControls';
import { FlowchartNodeType, getNodeType } from './NodeTypes';

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
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
}

interface FlowchartCanvasProps {
  nodes: FlowchartNode[];
  connections: FlowchartConnection[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onNodePositionChange: (nodeId: string, position: [number, number, number]) => void;
  onNodeDelete: (nodeId: string) => void;
  onAddNode: (type: string) => void;
}

export default function FlowchartCanvas({
  nodes,
  connections,
  selectedNodeId,
  onNodeClick,
  onNodePositionChange,
  onNodeDelete,
  onAddNode,
}: FlowchartCanvasProps) {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const CAMERA_MOVE_STEP = 1;
  const CAMERA_ZOOM_STEP = 0.5;
  const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 5, 10];

  const handleCanvasClick = (e: any) => {
    // If clicking on empty space, deselect
    if (e.object === e.scene || e.object === e.camera) {
      onNodeClick('');
    }
  };

  const handleDoubleClick = (e: any) => {
    // Double-click to add node at cursor position
    if (e.object === e.scene || e.object === e.camera) {
      // Add node at default position
      onAddNode('ai-thinking');
    }
  };

  // Navigation handlers
  const handlePan = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const moveVector = new THREE.Vector3();

    switch (direction) {
      case 'up':
        moveVector.set(0, CAMERA_MOVE_STEP, 0);
        break;
      case 'down':
        moveVector.set(0, -CAMERA_MOVE_STEP, 0);
        break;
      case 'left':
        moveVector.set(-CAMERA_MOVE_STEP, 0, 0);
        break;
      case 'right':
        moveVector.set(CAMERA_MOVE_STEP, 0, 0);
        break;
    }

    // Apply movement to both camera and target
    camera.position.add(moveVector);
    if (controls.target) {
      controls.target.add(moveVector);
      controls.update();
    }
  }, []);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const zoomDirection = direction === 'in' ? -CAMERA_ZOOM_STEP : CAMERA_ZOOM_STEP;
    
    // Move camera forward/backward along its look direction
    const directionVector = new THREE.Vector3();
    camera.getWorldDirection(directionVector);
    camera.position.add(directionVector.multiplyScalar(zoomDirection));
    
    controls.update();
  }, []);

  const handleReset = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    camera.position.set(...DEFAULT_CAMERA_POSITION);
    if (controls.target) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        handlePan(direction);
        return;
      }

      // Zoom with +/- keys
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoom('in');
        return;
      }
      
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoom('out');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePan, handleZoom]);

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
      <Canvas
        camera={{ position: DEFAULT_CAMERA_POSITION, fov: 50 }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
        }}
        onPointerMissed={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="night" />

          {/* Grid helper */}
          <gridHelper args={[20, 20, '#333333', '#222222']} position={[0, -2, 0]} />

          {/* Flowchart Nodes */}
          {nodes.map((node) => {
            const nodeType = getNodeType(node.type);
            if (!nodeType) return null;

            return (
              <EditableFlowchartNode
                key={node.id}
                node={node}
                nodeType={nodeType}
                isSelected={selectedNodeId === node.id}
                onClick={() => onNodeClick(node.id)}
                onPositionChange={onNodePositionChange}
                onDelete={onNodeDelete}
              />
            );
          })}

          {/* Connections */}
          <FlowchartConnections
            connections={connections.map(conn => ({
              from: conn.fromPosition,
              to: conn.toPosition,
              color: '#DC2626',
              animated: true,
            }))}
          />

          {/* Camera Controls */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>

      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
        Click node to select • Drag to move • Arrow keys to navigate • Double-click canvas to add node
      </div>

      {/* Navigation Controls (Mobile only) */}
      <CanvasNavigationControls
        onPan={handlePan}
        onZoom={handleZoom}
        onReset={handleReset}
        viewMode="3d"
      />
    </div>
  );
}

