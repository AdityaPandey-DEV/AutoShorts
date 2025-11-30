'use client';

import { useState } from 'react';
import { Save, Plus, Trash2, Download, Upload, RotateCcw, RotateCw } from 'lucide-react';
import { NODE_TYPES_ARRAY } from './NodeTypes';
import Button from '@/components/ui/Button';

interface FlowchartToolbarProps {
  onSave: () => void;
  onAddNode: (type: string) => void;
  onDeleteSelected: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (data: any) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  selectedNodeId: string | null;
  saving?: boolean;
}

export default function FlowchartToolbar({
  onSave,
  onAddNode,
  onDeleteSelected,
  onClear,
  onExport,
  onImport,
  onUndo,
  onRedo,
  selectedNodeId,
  saving = false,
}: FlowchartToolbarProps) {
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        onImport(data);
      } catch (error) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Save */}
        <Button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </Button>

        {/* Add Node */}
        <div className="relative">
          <Button
            variant="secondary"
            onClick={() => setShowNodeMenu(!showNodeMenu)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </Button>
          {showNodeMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
              {NODE_TYPES_ARRAY.map((nodeType) => (
                <button
                  key={nodeType.id}
                  onClick={() => {
                    onAddNode(nodeType.id);
                    setShowNodeMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-xl">{nodeType.icon}</span>
                  <div>
                    <div className="font-medium text-black">{nodeType.name}</div>
                    <div className="text-xs text-gray-500">{nodeType.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        {selectedNodeId && (
          <Button
            variant="danger"
            onClick={onDeleteSelected}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        )}

        {/* Undo/Redo */}
        {(onUndo || onRedo) && (
          <>
            {onUndo && (
              <button
                onClick={onUndo}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Undo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {onRedo && (
              <button
                onClick={onRedo}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Redo"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Export/Import */}
        <Button
          variant="secondary"
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            ref={(el) => {
              if (el) (fileInputRef as any).current = el;
            }}
          />
          <Button
            variant="secondary"
            onClick={() => (fileInputRef as any)?.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
        </label>

        {/* Clear */}
        <Button
          variant="danger"
          onClick={onClear}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Click outside to close menu */}
      {showNodeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNodeMenu(false)}
        />
      )}
    </div>
  );
}

