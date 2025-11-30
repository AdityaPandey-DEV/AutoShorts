'use client';

import { useState, useEffect } from 'react';
import { BlueprintNode } from '@/src/types/flowchart';
import { FlowchartNodeType, getNodeType } from './NodeTypes';

interface NodePropertiesPanelProps {
  node: BlueprintNode | null;
  nodeType: FlowchartNodeType | null;
  onUpdate: (nodeId: string, updates: Partial<BlueprintNode>) => void;
}

export default function NodePropertiesPanel({
  node,
  nodeType,
  onUpdate,
}: NodePropertiesPanelProps) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (node) {
      setLabel(node.label || nodeType?.name || '');
    }
  }, [node, nodeType]);

  if (!node || !nodeType) {
    return (
      <div className="w-full h-full bg-[#2a2a2a] p-4">
        <div className="text-gray-400 text-center py-8">
          Select a node to edit its properties
        </div>
      </div>
    );
  }

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onUpdate(node.id, { label: newLabel });
  };

  return (
    <div className="w-full h-full bg-[#2a2a2a] flex flex-col">
      {/* Header - Hidden on mobile as it's in merged panel */}
      <div className="hidden md:block p-4 border-b border-gray-600">
        <h3 className="text-lg font-semibold text-white">Node Properties</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl">{nodeType.icon}</span>
          <span className="text-sm text-gray-400">{nodeType.name}</span>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden p-3 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-xl">{nodeType.icon}</span>
          <span className="text-sm font-semibold text-white">{nodeType.name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-thin">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder={nodeType.name}
          />
        </div>

        {/* Node Type Info */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Category
          </label>
          <div
            className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg capitalize"
            style={{
              backgroundColor: nodeType.color + '20',
              borderColor: nodeType.color + '40',
            }}
          >
            <span style={{ color: nodeType.color }}>{nodeType.category}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <div className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-gray-400 text-sm">
            {nodeType.description}
          </div>
        </div>

        {/* Pins */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Input Pins
          </label>
          <div className="space-y-1">
            {(node.inputPins || nodeType.inputPins || []).map((pin) => (
              <div
                key={pin.id}
                className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{pin.name}</span>
                  <span className="text-gray-500 text-xs">{pin.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Output Pins
          </label>
          <div className="space-y-1">
            {(node.outputPins || nodeType.outputPins || []).map((pin) => (
              <div
                key={pin.id}
                className="px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{pin.name}</span>
                  <span className="text-gray-500 text-xs">{pin.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Errors/Warnings */}
        {node.errors && node.errors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-red-400 mb-2">
              Errors
            </label>
            <div className="space-y-1">
              {node.errors.map((error, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-300"
                >
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {node.warnings && node.warnings.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-2">
              Warnings
            </label>
            <div className="space-y-1">
              {node.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-yellow-900/20 border border-yellow-500/50 rounded text-sm text-yellow-300"
                >
                  {warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

