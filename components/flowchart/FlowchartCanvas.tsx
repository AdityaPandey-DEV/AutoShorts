'use client';

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import EditableFlowchartNode from './EditableFlowchartNode';
import FlowchartConnections from '@/components/home/FlowchartConnections';
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
  onAddNode: (type: string, position: [number, number, number]) => void;
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
  const handleCanvasClick = (e: any) => {
    // If clicking on empty space, deselect
    if (e.object === e.scene || e.object === e.camera) {
      onNodeClick('');
    }
  };

  const handleDoubleClick = (e: any) => {
    // Double-click to add node at cursor position
    if (e.object === e.scene || e.object === e.camera) {
      // Get 3D position from mouse
      // For now, add at a default position
      const position: [number, number, number] = [0, 0, 0];
      onAddNode('ai-thinking', position);
    }
  };

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 50 }}
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
        Click node to select • Drag to move • Double-click canvas to add node
      </div>
    </div>
  );
}

