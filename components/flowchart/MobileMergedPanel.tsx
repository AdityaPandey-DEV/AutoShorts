'use client';

import { useState } from 'react';
import MobileTabNavigation from './MobileTabNavigation';
import VariablesPanel from './VariablesPanel';
import NodePropertiesPanel from './NodePropertiesPanel';
import AIChatAssistant from './AIChatAssistant';
import { FlowchartVariable, BlueprintNode } from '@/src/types/flowchart';
import { FlowchartNodeType } from './NodeTypes';

interface MobileMergedPanelProps {
  activeTab: 'variables' | 'properties' | 'ai';
  onTabChange: (tab: 'variables' | 'properties' | 'ai') => void;
  // Variables props
  variables: FlowchartVariable[];
  onVariableAdd: (variable: Omit<FlowchartVariable, 'id'>) => void;
  onVariableUpdate: (id: string, updates: Partial<FlowchartVariable>) => void;
  onVariableDelete: (id: string) => void;
  // Properties props
  selectedNode: BlueprintNode | null;
  selectedNodeType: FlowchartNodeType | null;
  onNodeUpdate: (nodeId: string, updates: Partial<BlueprintNode>) => void;
  // AI Assistant props
  currentFlowchart: {
    nodes: Array<{
      id: string;
      type: string;
      label?: string;
      position: [number, number, number];
    }>;
    connections: Array<{ from: string; to: string }>;
  };
  onApplySuggestion: (suggestion: any) => void;
}

export default function MobileMergedPanel({
  activeTab,
  onTabChange,
  variables,
  onVariableAdd,
  onVariableUpdate,
  onVariableDelete,
  selectedNode,
  selectedNodeType,
  onNodeUpdate,
  currentFlowchart,
  onApplySuggestion,
}: MobileMergedPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[#2a2a2a] border-t border-gray-600">
      {/* Tab Navigation */}
      <MobileTabNavigation activeTab={activeTab} onTabChange={onTabChange} />

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Variables Tab */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            activeTab === 'variables'
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          <VariablesPanel
            variables={variables}
            onAdd={onVariableAdd}
            onUpdate={onVariableUpdate}
            onDelete={onVariableDelete}
          />
        </div>

        {/* Properties Tab */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            activeTab === 'properties'
              ? 'translate-x-0 opacity-100'
              : activeTab === 'variables'
              ? '-translate-x-full opacity-0 pointer-events-none'
              : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          <NodePropertiesPanel
            node={selectedNode}
            nodeType={selectedNodeType}
            onUpdate={onNodeUpdate}
          />
        </div>

        {/* AI Assistant Tab */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            activeTab === 'ai'
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          <AIChatAssistant
            currentFlowchart={currentFlowchart}
            onApplySuggestion={onApplySuggestion}
          />
        </div>
      </div>
    </div>
  );
}

