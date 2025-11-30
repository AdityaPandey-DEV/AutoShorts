'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Connection {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  dashed?: boolean;
  animated?: boolean;
}

interface FlowchartConnectionsProps {
  connections: Connection[];
}

export default function FlowchartConnections({ connections }: FlowchartConnectionsProps) {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    // Animate connection lines if needed
    if (linesRef.current) {
      linesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group ref={linesRef}>
      {connections.map((conn, index) => {
        const points = [new THREE.Vector3(...conn.from), new THREE.Vector3(...conn.to)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const color = conn.color || '#DC2626';

        return (
          <group key={index}>
            <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
              color: color,
              opacity: 0.6,
              transparent: true,
            }))} />

            {/* Animated arrow/particle */}
            {conn.animated && (
              <AnimatedArrow
                from={conn.from}
                to={conn.to}
                color={color}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

function AnimatedArrow({
  from,
  to,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const arrowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (arrowRef.current) {
      // Animate arrow along the line
      const t = (Math.sin(state.clock.elapsedTime * 2) + 1) / 2;
      const fromVec = new THREE.Vector3(...from);
      const toVec = new THREE.Vector3(...to);
      const direction = toVec.clone().sub(fromVec);
      const position = fromVec.clone().add(direction.clone().multiplyScalar(t));

      arrowRef.current.position.copy(position);

      // Point arrow in direction of movement
      arrowRef.current.lookAt(toVec);
    }
  });

  return (
    <mesh ref={arrowRef}>
      <coneGeometry args={[0.1, 0.3, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

