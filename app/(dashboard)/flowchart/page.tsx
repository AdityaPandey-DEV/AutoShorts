'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import FlowchartCanvas, { FlowchartNode, FlowchartConnection } from '@/components/flowchart/FlowchartCanvas';
import AIChatAssistant from '@/components/flowchart/AIChatAssistant';
import FlowchartToolbar from '@/components/flowchart/FlowchartToolbar';
import { getNodeType } from '@/components/flowchart/NodeTypes';

export default function FlowchartEditorPage() {
  const searchParams = useSearchParams();
  const [nodes, setNodes] = useState<FlowchartNode[]>([]);
  const [connections, setConnections] = useState<FlowchartConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [flowchartName, setFlowchartName] = useState('My Automation Flowchart');
  const [saving, setSaving] = useState(false);
  const [flowchartId, setFlowchartId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Load flowchart if ID provided
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      loadFlowchart(parseInt(id, 10));
    }
  }, [searchParams]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (nodes.length > 0) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        handleSave(false);
      }, 30000);
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [nodes, connections, flowchartName]);

  const loadFlowchart = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/flowchart/${id}`);
      const data = await response.json();
      
      if (response.ok && data.flowchart) {
        setFlowchartId(data.flowchart.id);
        setFlowchartName(data.flowchart.name);
        
        setNodes(data.flowchart.flowchartData.nodes || []);
        setConnections(data.flowchart.flowchartData.connections || []);
      }
    } catch (error) {
      console.error('Error loading flowchart:', error);
      alert('Failed to load flowchart');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (showMessage = true) => {
    setSaving(true);
    try {
      const flowchartData = {
        nodes,
        connections,
      };

      const url = flowchartId ? `/api/flowchart/${flowchartId}` : '/api/flowchart';
      const method = flowchartId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flowchartName,
          flowchartData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (!flowchartId && data.flowchart) {
          setFlowchartId(data.flowchart.id);
        }
        if (showMessage) {
          alert('Flowchart saved successfully!');
        }
      } else {
        alert(`Error: ${data.error || 'Failed to save flowchart'}`);
      }
    } catch (error) {
      alert('Failed to save flowchart');
    } finally {
      setSaving(false);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId || null);
  };

  const handleNodePositionChange = (nodeId: string, position: [number, number, number]) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, position } : node
    ));
  };

  const handleAddNode = (type: string) => {
    const nodeType = getNodeType(type);
    if (!nodeType) return;

    const newNode: FlowchartNode = {
      id: `node-${Date.now()}`,
      type,
      position: [Math.random() * 4 - 2, 0, Math.random() * 4 - 2],
      label: nodeType.name,
    };

    setNodes(prev => [...prev, newNode]);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      handleDeleteNode(selectedNodeId);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the flowchart? This cannot be undone.')) {
      setNodes([]);
      setConnections([]);
      setSelectedNodeId(null);
    }
  };

  const handleExport = () => {
    const data = {
      name: flowchartName,
      nodes,
      connections,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowchartName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (data: any) => {
    if (data.nodes) setNodes(data.nodes);
    if (data.connections) setConnections(data.connections);
    if (data.name) setFlowchartName(data.name);
  };

  const handleApplySuggestion = (suggestion: any) => {
    if (suggestion.type === 'add_node' && suggestion.data?.nodeType) {
      handleAddNode(suggestion.data.nodeType);
    }
  };

  // Update connection positions when nodes move
  const connectionsWithPositions: FlowchartConnection[] = connections.map(conn => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    return {
      ...conn,
      fromPosition: fromNode?.position || [0, 0, 0],
      toPosition: toNode?.position || [0, 0, 0],
    };
  }).filter(conn => {
    // Only show connections where both nodes exist
    return nodes.some(n => n.id === conn.from) && nodes.some(n => n.id === conn.to);
  });

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading flowchart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <input
          type="text"
          value={flowchartName}
          onChange={(e) => setFlowchartName(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-black w-full"
          placeholder="Flowchart Name"
        />
      </div>

      {/* Toolbar */}
      <FlowchartToolbar
        onSave={() => handleSave(true)}
        onAddNode={handleAddNode}
        onDeleteSelected={handleDeleteSelected}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport}
        selectedNodeId={selectedNodeId}
        saving={saving}
      />

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1">
          <FlowchartCanvas
            nodes={nodes}
            connections={connectionsWithPositions}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
            onNodePositionChange={handleNodePositionChange}
            onNodeDelete={handleDeleteNode}
            onAddNode={handleAddNode}
          />
        </div>

        {/* AI Chat */}
        <div className="w-96 border-l border-gray-200">
          <AIChatAssistant
            currentFlowchart={{ nodes, connections }}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>
      </div>
    </div>
  );
}

