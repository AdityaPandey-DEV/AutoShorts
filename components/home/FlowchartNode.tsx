'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface FlowchartNodeProps {
  position: [number, number, number];
  label: string;
  color: string;
  onClick?: () => void;
  description?: string;
  icon?: string;
}

export default function FlowchartNode({
  position,
  label,
  color,
  onClick,
  description,
  icon,
  ...props
}: FlowchartNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const basePositionRef = useRef<[number, number, number]>(position);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Update base position if prop changes
  if (basePositionRef.current[0] !== position[0] || 
      basePositionRef.current[1] !== position[1] || 
      basePositionRef.current[2] !== position[2]) {
    basePositionRef.current = position;
  }

  useFrame((state) => {
    if (groupRef.current && meshRef.current) {
      // Set group position to the base position (this should be static)
      groupRef.current.position.set(...basePositionRef.current);
      
      // Apply floating animation only to the mesh within the group
      const floatOffset = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = floatOffset;
      
      // Hover scale animation - scale from center
      if (hovered || clicked) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.1);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  const handleClick = () => {
    setClicked(!clicked);
    onClick?.();
  };

  return (
    <group ref={groupRef} position={basePositionRef.current}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        {...props}
      >
        <boxGeometry args={[2, 1.5, 0.5]} />
        <meshStandardMaterial
          color={hovered || clicked ? color : color}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {/* Icon/Emoji */}
      {icon && (
        <Text
          position={[0, 0, 0.3]}
          fontSize={0.5}
          anchorX="center"
          anchorY="middle"
        >
          {icon}
        </Text>
      )}
    </group>
  );
}

