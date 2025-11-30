'use client';

import { useState } from 'react';
import { FlowchartVariable, PinType } from '@/src/types/flowchart';
import { Plus, Trash2 } from 'lucide-react';

interface VariablesPanelProps {
  variables: FlowchartVariable[];
  onAdd: (variable: Omit<FlowchartVariable, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<FlowchartVariable>) => void;
  onDelete: (id: string) => void;
}

const VARIABLE_TYPES: PinType[] = ['string', 'number', 'boolean', 'object', 'array'];

export default function VariablesPanel({
  variables,
  onAdd,
  onUpdate,
  onDelete,
}: VariablesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<PinType>('string');

  const handleAdd = () => {
    if (newVarName.trim()) {
      onAdd({
        name: newVarName.trim(),
        type: newVarType,
        defaultValue: undefined,
      });
      setNewVarName('');
      setNewVarType('string');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#2a2a2a] flex flex-col">
      {/* Header - Hidden on mobile as it's in merged panel */}
      <div className="hidden md:block p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Variables</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-all duration-200 hover:scale-110 active:scale-95"
            title="Add Variable"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden p-3 border-b border-gray-600 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Variables</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 text-gray-400 active:text-white active:bg-[#333] rounded transition-all duration-200 active:scale-95 touch-manipulation"
          title="Add Variable"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 scrollbar-thin">
        {/* Add new variable form */}
        {isAdding && (
          <div className="p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg space-y-2 fade-in">
            <input
              type="text"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              placeholder="Variable name"
              className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <select
              value={newVarType}
              onChange={(e) => setNewVarType(e.target.value as PinType)}
              className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              {VARIABLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewVarName('');
                }}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Variables list */}
        {variables.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            No variables. Click + to add one.
          </div>
        ) : (
          variables.map((variable) => (
            <div
              key={variable.id}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/variable', JSON.stringify({
                  id: variable.id,
                  name: variable.name,
                  type: variable.type,
                }));
                e.dataTransfer.effectAllowed = 'copy';
                // Visual feedback
                if (e.currentTarget) {
                  e.currentTarget.style.opacity = '0.5';
                }
              }}
              onDragEnd={(e) => {
                // Restore opacity
                if (e.currentTarget) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
              className="p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg transition-all duration-200 hover:border-gray-500 hover:shadow-lg hover-lift cursor-move"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{variable.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                      {variable.type}
                    </span>
                  </div>
                  {variable.description && (
                    <div className="text-xs text-gray-400 mt-1">{variable.description}</div>
                  )}
                </div>
                <button
                  onClick={() => onDelete(variable.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all duration-200 active:scale-95 touch-manipulation"
                  title="Delete variable"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

