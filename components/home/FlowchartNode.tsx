'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
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

  // Use useEffect to update base position when prop changes
  useEffect(() => {
    basePositionRef.current = position;
  }, [position[0], position[1], position[2]]);

  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    
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
      
      {/* Label - wrapped in Suspense to prevent ref errors */}
      <Suspense fallback={null}>
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </Suspense>

      {/* Icon/Emoji - wrapped in Suspense to prevent ref errors */}
      {icon && (
        <Suspense fallback={null}>
          <Text
            position={[0, 0, 0.3]}
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
          >
            {icon}
          </Text>
        </Suspense>
      )}
    </group>
  );
}

