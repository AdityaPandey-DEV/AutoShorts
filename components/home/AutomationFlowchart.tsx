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
      <>
        <div className="w-full bg-black rounded-lg p-4 md:p-6 overflow-x-auto">
          {/* 2D Flowchart Container */}
          <div className="relative min-h-[500px] py-8" style={{ minWidth: '800px' }}>
            <svg className="absolute inset-0 w-full h-full" style={{ minWidth: '800px', minHeight: '400px' }}>
              <defs>
                <marker
                  id="arrowhead-red"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#DC2626" />
                </marker>
                <marker
                  id="arrowhead-green"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#16A34A" />
                </marker>
                <marker
                  id="arrowhead-green-dashed"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#16A34A" />
                </marker>
              </defs>
              
              {/* Arrow 1: AI Thinking → Video Creator */}
              <line
                x1="140"
                y1="48"
                x2="240"
                y2="200"
                stroke="#DC2626"
                strokeWidth="3"
                markerEnd="url(#arrowhead-red)"
              />
              
              {/* Arrow 2: Video Creator → YouTube Upload */}
              <line
                x1="260"
                y1="224"
                x2="500"
                y2="224"
                stroke="#DC2626"
                strokeWidth="3"
                markerEnd="url(#arrowhead-red)"
              />
              
              {/* Arrow 3: YouTube Upload → Feedback Loop */}
              <line
                x1="620"
                y1="224"
                x2="660"
                y2="48"
                stroke="#16A34A"
                strokeWidth="3"
                markerEnd="url(#arrowhead-green)"
              />
              
              {/* Arrow 4: Feedback Loop → AI Thinking (Loop Back - curved) */}
              <path
                d="M 700 48 L 700 100 Q 700 280, 80 280 Q 80 100, 80 48"
                stroke="#16A34A"
                strokeWidth="3"
                strokeDasharray="5,5"
                fill="none"
                markerEnd="url(#arrowhead-green-dashed)"
              />
            </svg>

            {/* Flowchart Blocks */}
            <div className="relative w-full h-full">
              {/* AI Thinking Block - Top Left */}
              <div
                className="absolute bg-red-600 rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center border-2 border-red-500"
                style={{ left: '0px', top: '0px', width: '120px', height: '96px' }}
                onClick={() => handleNodeClick('ai-thinking')}
              >
                <div className="text-3xl mb-1">🧠</div>
                <div className="text-white text-xs font-bold text-center px-2">AI Thinking</div>
              </div>

              {/* Video Creator Block - Middle Left */}
              <div
                className="absolute bg-red-600 rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center border-2 border-red-500"
                style={{ left: '200px', top: '176px', width: '120px', height: '96px' }}
                onClick={() => handleNodeClick('video-creator')}
              >
                <div className="text-3xl mb-1">🎬</div>
                <div className="text-white text-xs font-bold text-center px-2">Video Creator</div>
              </div>

              {/* YouTube Upload Block - Middle Right */}
              <div
                className="absolute bg-green-600 rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center border-2 border-green-500"
                style={{ left: '440px', top: '176px', width: '120px', height: '96px' }}
                onClick={() => handleNodeClick('youtube-upload')}
              >
                <div className="text-3xl mb-1">📺</div>
                <div className="text-white text-xs font-bold text-center px-2">YouTube Upload</div>
              </div>

              {/* Feedback Loop Block - Top Right */}
              <div
                className="absolute bg-green-600 rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center border-2 border-green-500"
                style={{ left: '640px', top: '0px', width: '120px', height: '96px' }}
                onClick={() => handleNodeClick('feedback-loop')}
              >
                <div className="text-3xl mb-1">📊</div>
                <div className="text-white text-xs font-bold text-center px-2">Feedback Loop</div>
              </div>
            </div>
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

  return (
    <>
      {/* Canvas Container */}
      <div className={`w-full ${isMobile ? 'h-[400px]' : 'h-[600px]'} bg-black rounded-lg overflow-hidden relative`}>
        <Canvas 
          camera={{ position: [0, 2.5, isMobile ? 12 : 10], fov: isMobile ? 55 : 50 }}
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

          {/* Camera Controls - panning enabled, rotation disabled */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={false}
            minDistance={isMobile ? 8 : 5}
            maxDistance={isMobile ? 18 : 20}
            autoRotate={false}
            touches={{
              ONE: 1, // Pan (drag to move)
              TWO: 2, // Zoom (pinch to zoom)
            }}
          />
          </Suspense>

        </Canvas>

        {/* Controls Help Text */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm z-10">
          {isMobile ? (
            <>Tap blocks to learn more • Drag to pan • Pinch to zoom</>
          ) : (
            <>Click blocks to learn more • Drag to pan • Scroll to zoom</>
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

