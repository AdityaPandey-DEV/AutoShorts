'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import BlueprintCanvas from '@/components/flowchart/BlueprintCanvas';
import FlowchartCanvas, { FlowchartNode, FlowchartConnection } from '@/components/flowchart/FlowchartCanvas';
import NodePalette from '@/components/flowchart/NodePalette';
import NodePropertiesPanel from '@/components/flowchart/NodePropertiesPanel';
import VariablesPanel from '@/components/flowchart/VariablesPanel';
import MobileMergedPanel from '@/components/flowchart/MobileMergedPanel';
import FlowchartToolbar from '@/components/flowchart/FlowchartToolbar';
import Link from 'next/link';
import AIChatAssistant from '@/components/flowchart/AIChatAssistant';
import { BlueprintNode, BlueprintConnection, BlueprintFlowchartData, FlowchartVariable, CommentBox, ViewportState } from '@/src/types/flowchart';
import { screenToWorld } from '@/components/flowchart/utils/canvasUtils';
import { getNodeType } from '@/components/flowchart/NodeTypes';
import { convertLegacyToBlueprint } from '@/components/flowchart/utils/convertLegacy';

export default function FlowchartEditorPage() {
  const searchParams = useSearchParams();
  const [nodes, setNodes] = useState<BlueprintNode[]>([]);
  const [connections, setConnections] = useState<BlueprintConnection[]>([]);
  const [variables, setVariables] = useState<FlowchartVariable[]>([]);
  const [comments, setComments] = useState<CommentBox[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [flowchartName, setFlowchartName] = useState('My Automation Flowchart');
  const [saving, setSaving] = useState(false);
  const [flowchartId, setFlowchartId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [viewport, setViewport] = useState<ViewportState>({ zoom: 1, panX: 0, panY: 0 });
  const [rightSidebarTab, setRightSidebarTab] = useState<'properties' | 'ai'>('properties');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'variables' | 'properties' | 'ai'>('variables');
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Convert BlueprintNode (2D) to FlowchartNode (3D)
  const convertTo3D = (node: BlueprintNode): FlowchartNode => ({
    id: node.id,
    type: node.type,
    position: [node.position[0], 0, node.position[1]], // [x, 0, y] for 3D
    label: node.label,
    data: node.data,
  });

  // Convert FlowchartNode (3D) to BlueprintNode (2D)
  const convertTo2D = (node: FlowchartNode): BlueprintNode => {
    const nodeType = getNodeType(node.type);
    return {
      id: node.id,
      type: node.type,
      position: [node.position[0], node.position[2]], // [x, z] for 2D
      label: node.label,
      data: node.data,
      inputPins: nodeType?.inputPins ? [...nodeType.inputPins] : [],
      outputPins: nodeType?.outputPins ? [...nodeType.outputPins] : [],
    };
  };

  // Convert BlueprintConnection to FlowchartConnection with current node positions
  const get3DConnections = (): FlowchartConnection[] => {
    return connections.map(conn => {
      const fromNode = nodes.find(n => n.id === conn.fromNodeId);
      const toNode = nodes.find(n => n.id === conn.toNodeId);
      
      return {
        id: conn.id,
        from: conn.fromNodeId,
        to: conn.toNodeId,
        fromPosition: fromNode ? [fromNode.position[0], 0, fromNode.position[1]] : [0, 0, 0],
        toPosition: toNode ? [toNode.position[0], 0, toNode.position[1]] : [0, 0, 0],
      };
    });
  };

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
  }, [nodes, connections, flowchartName, variables, comments]);

  const loadFlowchart = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/flowchart/${id}`);
      const data = await response.json();
      
      if (response.ok && data.flowchart) {
        setFlowchartId(data.flowchart.id);
        setFlowchartName(data.flowchart.name);
        
        const flowchartData = data.flowchart.flowchartData;
        
        // Check if it's legacy format or new format
        if (flowchartData.nodes && flowchartData.nodes.length > 0) {
          const firstNode = flowchartData.nodes[0];
          
          // Check if legacy format (has 3D position array)
          if (Array.isArray(firstNode.position) && firstNode.position.length === 3) {
            // Convert legacy format
            const converted = convertLegacyToBlueprint(
              flowchartData.nodes,
              flowchartData.connections || []
            );
            setNodes(converted.nodes);
            setConnections(converted.connections);
            setVariables(converted.variables || []);
            setComments(converted.comments || []);
            if (converted.viewport) setViewport(converted.viewport);
          } else {
            // New format
            setNodes(flowchartData.nodes || []);
            setConnections(flowchartData.connections || []);
            setVariables(flowchartData.variables || []);
            setComments(flowchartData.comments || []);
            if (flowchartData.viewport) setViewport(flowchartData.viewport);
          }
        }
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
      const flowchartData: BlueprintFlowchartData = {
        nodes,
        connections,
        variables,
        comments,
        viewport,
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

  const handleNodePositionChange = (nodeId: string, position: [number, number]) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, position } : node
    ));
  };

  const handleNodePositionChange3D = (nodeId: string, position: [number, number, number]) => {
    // Convert 3D position to 2D and update
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, position: [position[0], position[2]] } : node
    ));
  };

  const handleAddNode = (type: string) => {
    if (!type) {
      // Empty string means open palette
      setShowNodePalette(true);
      return;
    }

    const nodeType = getNodeType(type);
    if (!nodeType) {
      console.error('Node type not found:', type);
      return;
    }

    // Position new node at the visible center of the canvas
    // Use screenToWorld to convert screen center to world coordinates
    // This accounts for zoom, pan, and canvas size correctly
    // Formula: worldX = (screenX - canvasWidth/2) / zoom + panX
    // For screen center: worldX = (canvasWidth/2 - canvasWidth/2) / zoom + panX = panX
    // So [panX, panY] should be correct, but let's use screenToWorld to be safe
    // Use a reasonable default canvas size (actual size will be close)
    const defaultCanvasSize = { width: 1200, height: 800 }; // More realistic default
    const screenCenter = { x: defaultCanvasSize.width / 2, y: defaultCanvasSize.height / 2 };
    const worldCenter = screenToWorld(screenCenter, viewport, defaultCanvasSize);
    
    const newNode: BlueprintNode = {
      id: `node-${Date.now()}`,
      type,
      position: [worldCenter.x, worldCenter.y], // Visible center calculated from screen center
      label: nodeType.name,
      inputPins: nodeType.inputPins ? [...nodeType.inputPins] : [],
      outputPins: nodeType.outputPins ? [...nodeType.outputPins] : [],
    };

    setNodes(prev => [...prev, newNode]);
    setShowNodePalette(false);
    // Select the newly added node
    setSelectedNodeId(newNode.id);
  };

  const handleVariableDrop = (variableId: string, variableName: string, variableType: string, position: [number, number]) => {
    // Create a node that represents getting a variable value
    // Use the variable's type to determine the node type (string, number, boolean, etc.)
    // Store the variable reference in the node's data
    const nodeType = getNodeType(variableType);
    if (!nodeType) {
      console.error('Node type not found for variable type:', variableType);
      return;
    }

    const newNode: BlueprintNode = {
      id: `node-${Date.now()}`,
      type: variableType, // Use the variable's type as the node type
      position,
      label: `Get ${variableName}`, // Label the node with the variable name
      inputPins: nodeType.inputPins ? [...nodeType.inputPins] : [],
      outputPins: nodeType.outputPins ? [...nodeType.outputPins] : [],
      data: {
        variableId, // Store reference to the variable
        variableName,
      },
    };

    setNodes(prev => [...prev, newNode]);
    // Select the newly added node
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleConnectionCreate = (fromNodeId: string, fromPinId: string, toNodeId: string, toPinId: string) => {
    const newConnection: BlueprintConnection = {
      id: `conn-${Date.now()}`,
      fromNodeId,
      fromPinId,
      toNodeId,
      toPinId,
      type: 'execution', // TODO: Determine from pin types
    };

    setConnections(prev => [...prev, newConnection]);
  };

  const handleConnectionDelete = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
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
      setVariables([]);
      setComments([]);
      setSelectedNodeId(null);
    }
  };

  const handleExport = () => {
    const data: BlueprintFlowchartData = {
      nodes,
      connections,
      variables,
      comments,
      viewport,
    };
    const blob = new Blob([JSON.stringify({ name: flowchartName, ...data }, null, 2)], { type: 'application/json' });
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
    if (data.variables) setVariables(data.variables);
    if (data.comments) setComments(data.comments);
    if (data.viewport) setViewport(data.viewport);
    if (data.name) setFlowchartName(data.name);
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<BlueprintNode>) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  const handleVariableAdd = (variable: Omit<FlowchartVariable, 'id'>) => {
    setVariables(prev => [...prev, { ...variable, id: `var-${Date.now()}` }]);
  };

  const handleVariableUpdate = (id: string, updates: Partial<FlowchartVariable>) => {
    setVariables(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const handleVariableDelete = (id: string) => {
    setVariables(prev => prev.filter(v => v.id !== id));
  };

  const handleApplySuggestion = (suggestion: any) => {
    if (suggestion.type === 'add_node' && suggestion.data?.nodeType) {
      handleAddNode(suggestion.data.nodeType);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedNodeType = selectedNode ? getNodeType(selectedNode.type) : null;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading flowchart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="bg-[#2a2a2a] border-b border-gray-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={flowchartName}
            onChange={(e) => setFlowchartName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-white w-full placeholder-gray-500"
            placeholder="Flowchart Name"
          />
          <Link
            href="/dashboard"
            className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <FlowchartToolbar
        onSave={() => handleSave(true)}
        onAddNode={() => setShowNodePalette(true)}
        onDeleteSelected={handleDeleteSelected}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport}
        selectedNodeId={selectedNodeId}
        saving={saving}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Editor Area */}
      {isMobile ? (
        /* Mobile Layout: Vertical Stack */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas - Takes 60-70% of height */}
          <div className="flex-[3] min-h-0 relative">
            {viewMode === '2d' ? (
              <BlueprintCanvas
                nodes={nodes}
                connections={connections}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onNodePositionChange={handleNodePositionChange}
                onNodeDelete={handleDeleteNode}
                onConnectionCreate={handleConnectionCreate}
                onConnectionDelete={handleConnectionDelete}
                snapToGridEnabled={true}
                initialViewport={viewport}
                onViewportChange={setViewport}
                onVariableDrop={handleVariableDrop}
              />
            ) : (
              <FlowchartCanvas
                nodes={nodes.map(convertTo3D)}
                connections={get3DConnections()}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onNodePositionChange={handleNodePositionChange3D}
                onNodeDelete={handleDeleteNode}
                onAddNode={(type) => handleAddNode(type)}
              />
            )}
          </div>

          {/* Merged Panel - Takes 30-40% of height */}
          <div className="flex-[2] min-h-[200px] max-h-[40vh]">
            <MobileMergedPanel
              activeTab={mobileTab}
              onTabChange={setMobileTab}
              variables={variables}
              onVariableAdd={handleVariableAdd}
              onVariableUpdate={handleVariableUpdate}
              onVariableDelete={handleVariableDelete}
              selectedNode={selectedNode || null}
              selectedNodeType={selectedNodeType}
              onNodeUpdate={handleNodeUpdate}
              currentFlowchart={{
                nodes: nodes.map(node => ({
                  id: node.id,
                  type: node.type,
                  label: node.label,
                  position: [node.position[0], 0, node.position[1]] as [number, number, number],
                })),
                connections: connections.map(c => ({ from: c.fromNodeId, to: c.toNodeId })),
              }}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>
        </div>
      ) : (
        /* Desktop Layout: Three Columns */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Variables */}
          <div className="w-64 border-r border-gray-600 bg-[#2a2a2a] flex flex-col">
            <VariablesPanel
              variables={variables}
              onAdd={handleVariableAdd}
              onUpdate={handleVariableUpdate}
              onDelete={handleVariableDelete}
            />
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            {viewMode === '2d' ? (
              <BlueprintCanvas
                nodes={nodes}
                connections={connections}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onNodePositionChange={handleNodePositionChange}
                onNodeDelete={handleDeleteNode}
                onConnectionCreate={handleConnectionCreate}
                onConnectionDelete={handleConnectionDelete}
                snapToGridEnabled={true}
                initialViewport={viewport}
                onViewportChange={setViewport}
                onVariableDrop={handleVariableDrop}
              />
            ) : (
              <FlowchartCanvas
                nodes={nodes.map(convertTo3D)}
                connections={get3DConnections()}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onNodePositionChange={handleNodePositionChange3D}
                onNodeDelete={handleDeleteNode}
                onAddNode={(type) => handleAddNode(type)}
              />
            )}
          </div>

          {/* Right Sidebar - Properties & AI Assistant */}
          <div className="w-80 border-l border-gray-600 bg-[#2a2a2a] flex flex-col">
            <div className="flex border-b border-gray-600">
              <button
                onClick={() => setRightSidebarTab('properties')}
                className={`flex-1 px-4 py-2 text-white transition-colors ${
                  rightSidebarTab === 'properties'
                    ? 'bg-[#1a1a1a] border-b-2 border-blue-500'
                    : 'bg-[#2a2a2a] hover:bg-[#333]'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setRightSidebarTab('ai')}
                className={`flex-1 px-4 py-2 text-white transition-colors ${
                  rightSidebarTab === 'ai'
                    ? 'bg-[#1a1a1a] border-b-2 border-blue-500'
                    : 'bg-[#2a2a2a] hover:bg-[#333]'
                }`}
              >
                AI Assistant
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {rightSidebarTab === 'properties' ? (
                <NodePropertiesPanel
                  node={selectedNode || null}
                  nodeType={selectedNodeType}
                  onUpdate={handleNodeUpdate}
                />
              ) : (
                <AIChatAssistant
                  currentFlowchart={{
                    nodes: nodes.map(node => ({
                      id: node.id,
                      type: node.type,
                      label: node.label,
                      position: [node.position[0], 0, node.position[1]] as [number, number, number],
                    })),
                    connections: connections.map(c => ({ from: c.fromNodeId, to: c.toNodeId })),
                  }}
                  onApplySuggestion={handleApplySuggestion}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Node Palette Modal */}
      {showNodePalette && (
        <NodePalette
          isOpen={showNodePalette}
          onClose={() => setShowNodePalette(false)}
          onSelectNode={handleAddNode}
        />
      )}
    </div>
  );
}

