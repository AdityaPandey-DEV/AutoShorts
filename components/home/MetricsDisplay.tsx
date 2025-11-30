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

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
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
  const hasStarted = useRef(false);

  useFrame(() => {
    // Animate counter incrementing
    if (!hasStarted.current) {
      hasStarted.current = true;
    }
    if (currentValue.current < targetValue) {
      currentValue.current = Math.min(
        currentValue.current + targetValue * 0.01,
        targetValue
      );
    }
  });

  const displayValue = currentValue.current >= targetValue
    ? formatNumber(targetValue)
    : formatNumber(currentValue.current);

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

