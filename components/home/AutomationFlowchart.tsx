'use client';

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import FlowchartNode from './FlowchartNode';
import FlowchartConnections from './FlowchartConnections';
import NodeInfoModal from './NodeInfoModal';
import MetricsDisplayHTML from './MetricsDisplayHTML';

const nodeData = [
  {
    id: 'ai-thinking',
    position: [-6, 2, 0] as [number, number, number],
    label: 'AI Thinking',
    color: '#DC2626',
    icon: '🧠',
    description: 'Our advanced AI analyzes trending topics, user feedback, and performance metrics to generate engaging story concepts that resonate with your audience.',
    features: [
      'Trend analysis and topic research',
      'Story generation with engaging hooks',
      'Learning from feedback and analytics',
      'Optimization based on performance data',
    ],
  },
  {
    id: 'video-creator',
    position: [-2, 0, 0] as [number, number, number],
    label: 'Video Creator',
    color: '#DC2626',
    icon: '🎬',
    description: 'Automatically creates professional video content by combining AI-generated scripts with stock footage, adding narration, and assembling everything into engaging Shorts.',
    features: [
      'Automatic video clip selection',
      'Text-to-speech narration',
      'Video assembly and editing',
      'Format optimization for YouTube Shorts',
    ],
  },
  {
    id: 'youtube-upload',
    position: [2, 0, 0] as [number, number, number],
    label: 'YouTube Upload',
    color: '#16A34A',
    icon: '📺',
    description: 'Seamlessly uploads your videos directly to YouTube, optimizes titles and descriptions, and schedules posts for maximum engagement.',
    features: [
      'Automatic upload to your channel',
      'SEO-optimized titles and descriptions',
      'Thumbnail generation',
      'Scheduled publishing',
    ],
  },
  {
    id: 'feedback-loop',
    position: [6, 2, 0] as [number, number, number],
    label: 'Feedback Loop',
    color: '#16A34A',
    icon: '📊',
    description: 'Continuously monitors video performance, comments, and engagement metrics to improve future content creation.',
    features: [
      'Real-time analytics monitoring',
      'Comment analysis and sentiment tracking',
      'Performance-based optimization',
      'Automated improvement suggestions',
    ],
  },
];

const connections = [
  {
    from: [-6, 2, 0] as [number, number, number],
    to: [-2, 0, 0] as [number, number, number],
    color: '#DC2626',
    animated: true,
  },
  {
    from: [-2, 0, 0] as [number, number, number],
    to: [2, 0, 0] as [number, number, number],
    color: '#DC2626',
    animated: true,
  },
  {
    from: [2, 0, 0] as [number, number, number],
    to: [6, 2, 0] as [number, number, number],
    color: '#16A34A',
    animated: true,
  },
  {
    from: [6, 2, 0] as [number, number, number],
    to: [-6, 2, 0] as [number, number, number],
    color: '#16A34A',
    dashed: true,
    animated: true,
  },
];

const metrics = [
  { label: 'Views', value: 1200000, suffix: '+', color: '#DC2626' },
  { label: 'Subscribers', value: 50000, suffix: '+', color: '#16A34A' },
  { label: 'Earnings', value: 5000, suffix: '/month', color: '#16A34A' },
];

export default function AutomationFlowchart() {
  const [selectedNode, setSelectedNode] = useState<typeof nodeData[0] | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check WebGL support
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setWebglSupported(!!gl);
      } catch (e) {
        setWebglSupported(false);
      }
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkWebGL();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNodeClick = (nodeId: string) => {
    const node = nodeData.find(n => n.id === nodeId);
    setSelectedNode(node || null);
  };

  // 2D Simplified version for mobile only if WebGL is not supported
  if (isMobile && !webglSupported) {
    return (
      <div className="w-full bg-black rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6">
          {nodeData.map((node, index) => (
            <div
              key={node.id}
              className="bg-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleNodeClick(node.id)}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{node.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-black mb-2">{node.label}</h3>
                  <p className="text-gray-600">{node.description.substring(0, 100)}...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Metrics on Mobile */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {metric.value >= 1000000 
                  ? (metric.value / 1000000).toFixed(1) + 'M'
                  : metric.value >= 1000 
                  ? (metric.value / 1000).toFixed(1) + 'K'
                  : metric.value}
                {metric.suffix}
              </div>
              <div className="text-sm text-gray-400">{metric.label}</div>
            </div>
          ))}
        </div>

        <NodeInfoModal
          node={selectedNode ? {
            label: selectedNode.label,
            description: selectedNode.description,
            features: selectedNode.features,
            icon: selectedNode.icon,
            iconType: selectedNode.id,
            color: selectedNode.color,
          } : null}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    );
  }

  return (
    <>
      {/* Canvas Container */}
      <div className={`w-full ${isMobile ? 'h-[400px]' : 'h-[600px]'} bg-black rounded-lg overflow-hidden relative`}>
        <Canvas 
          camera={{ position: [0, 3, 10], fov: isMobile ? 60 : 50 }}
          gl={{ 
            preserveDrawingBuffer: true, 
            alpha: true,
            antialias: !isMobile, // Disable antialiasing on mobile for better performance
            powerPreference: 'high-performance',
          }}
          dpr={isMobile ? Math.min(window.devicePixelRatio, 2) : undefined} // Limit DPR on mobile
          performance={{ min: 0.5 }} // Allow lower framerate on mobile
        >
          {/* Lighting - outside Suspense for immediate rendering */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          {!isMobile && <pointLight position={[-10, -10, -5]} intensity={0.5} />}

          <Suspense fallback={null}>
          {/* Environment - lighter on mobile for performance */}
          {!isMobile && <Environment preset="night" />}

            {/* Flowchart Nodes */}
            {nodeData.map((node) => (
              <FlowchartNode
                key={node.id}
                position={node.position}
                label={node.label}
                color={node.color}
                icon={node.icon}
                onClick={() => handleNodeClick(node.id)}
              />
            ))}

            {/* Connections */}
            <FlowchartConnections connections={connections} />

          {/* Camera Controls - optimized for mobile touch */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={isMobile ? 6 : 5}
            maxDistance={isMobile ? 18 : 20}
            autoRotate={false}
            touches={{
              ONE: 2, // Rotate
              TWO: 1, // Zoom
            }}
          />
          </Suspense>

        </Canvas>

        {/* Controls Help Text */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm z-10">
          {isMobile ? (
            <>Tap blocks to learn more • Swipe to rotate • Pinch to zoom</>
          ) : (
            <>Click blocks to learn more • Drag to rotate • Scroll to zoom</>
          )}
        </div>
      </div>

      {/* HTML Metrics Display below canvas */}
      <MetricsDisplayHTML metrics={metrics} />

      {/* Info Modal */}
      <NodeInfoModal
        node={selectedNode ? {
          label: selectedNode.label,
          description: selectedNode.description,
          features: selectedNode.features,
          icon: selectedNode.icon,
          iconType: selectedNode.id,
          color: selectedNode.color,
        } : null}
        onClose={() => setSelectedNode(null)}
      />
    </>
  );
}

