'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FlowchartNodeType } from './NodeTypes';

export interface EditableFlowchartNodeData {
  id: string;
  type: string;
  position: [number, number, number];
  label?: string;
  data?: any;
}

interface EditableFlowchartNodeProps {
  node: EditableFlowchartNodeData;
  nodeType: FlowchartNodeType;
  isSelected: boolean;
  onClick: () => void;
  onPositionChange?: (id: string, position: [number, number, number]) => void;
  onDelete?: (id: string) => void;
}

export default function EditableFlowchartNode({
  node,
  nodeType,
  isSelected,
  onClick,
  onPositionChange,
  onDelete,
}: EditableFlowchartNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);

  const label = node.label || nodeType.name;
  const color = isSelected ? '#FBBF24' : (hovered ? nodeType.color : nodeType.color);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    if (!isDragging) {
      // Gentle floating animation when not dragging
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
    
    // Scale animation
    if (hovered || isSelected) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.1);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    const intersect = e.intersections[0];
    if (intersect) {
      setDragStart([intersect.point.x, intersect.point.z]);
    }
  };

  const handlePointerMove = (e: any) => {
    if (isDragging && dragStart && onPositionChange) {
      const intersect = e.intersections[0];
      if (intersect) {
        const newX = intersect.point.x;
        const newZ = intersect.point.z;
        const newY = node.position[1];
        onPositionChange(node.id, [newX, newY, newZ]);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[2, 1.5, 0.5]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected || hovered ? color : '#000000'}
          emissiveIntensity={isSelected || hovered ? 0.4 : 0}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {/* Icon */}
      <Text
        position={[0, 0, 0.3]}
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
      >
        {nodeType.icon}
      </Text>

      {/* Selected indicator */}
      {isSelected && (
        <mesh position={[0, 0, 0.35]}>
          <ringGeometry args={[1.1, 1.2, 32]} />
          <meshBasicMaterial color="#FBBF24" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

