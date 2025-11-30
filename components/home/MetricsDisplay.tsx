'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface Metric {
  label: string;
  value: number;
  suffix: string;
  color: string;
}

interface MetricsDisplayProps {
  position: [number, number, number];
  metrics: Metric[];
}

export default function MetricsDisplay({ position, metrics }: MetricsDisplayProps) {
  const groupRef = useRef<THREE.Group>(null);
  const basePositionRef = useRef<[number, number, number]>(position);

  // Update base position if prop changes
  if (basePositionRef.current[0] !== position[0] || 
      basePositionRef.current[1] !== position[1] || 
      basePositionRef.current[2] !== position[2]) {
    basePositionRef.current = position;
  }

  useFrame((state) => {
    if (groupRef.current) {
      // Set base position
      groupRef.current.position.set(...basePositionRef.current);
      // Apply floating animation relative to base position
      const floatOffset = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      groupRef.current.position.y += floatOffset;
    }
  });

  return (
    <group ref={groupRef} position={basePositionRef.current}>
      {metrics.map((metric, index) => (
        <group key={index} position={[0, -index * 1.5, 0]}>
          {/* Background card */}
          <mesh position={[0, 0, -0.1]}>
            <boxGeometry args={[3, 1, 0.2]} />
            <meshStandardMaterial
              color="#1F2937"
              opacity={0.9}
              transparent
              metalness={0.2}
              roughness={0.6}
            />
          </mesh>

          {/* Metric label */}
          <Text
            position={[-1.2, 0.3, 0]}
            fontSize={0.2}
            color="#9CA3AF"
            anchorX="left"
            anchorY="middle"
          >
            {metric.label}
          </Text>

          {/* Animated value */}
          <AnimatedCounter
            position={[1.2, 0, 0]}
            targetValue={metric.value}
            suffix={metric.suffix}
            color={metric.color}
          />
        </group>
      ))}
    </group>
  );
}

function AnimatedCounter({
  position,
  targetValue,
  suffix,
  color,
}: {
  position: [number, number, number];
  targetValue: number;
  suffix: string;
  color: string;
}) {
  const currentValue = useRef(0);
  const animationSpeed = useRef(0.02); // Adjust speed based on target value

  useFrame(() => {
    // Animate counter from 0 to target value
    if (currentValue.current < targetValue) {
      // Use percentage-based increment for smooth animation regardless of target value
      const increment = Math.max(targetValue * animationSpeed.current, targetValue / 100);
      currentValue.current = Math.min(
        currentValue.current + increment,
        targetValue
      );
    }
  });

  const displayValue = currentValue.current >= targetValue
    ? formatNumber(targetValue)
    : formatNumber(Math.max(0, currentValue.current));

  return (
    <group position={position}>
      <Text
        fontSize={0.3}
        color={color}
        anchorX="right"
        anchorY="middle"
        fontWeight="bold"
      >
        {displayValue}{suffix}
      </Text>
    </group>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.floor(num).toString();
}

