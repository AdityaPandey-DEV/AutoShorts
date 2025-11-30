'use client';

import { useRef } from 'react';
import { Save, Plus, Trash2, Download, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';

interface FlowchartToolbarProps {
  onSave: () => void;
  onAddNode: () => void;
  onDeleteSelected: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (data: any) => void;
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
  selectedNodeId,
  saving = false,
}: FlowchartToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

        {/* Add Node - Opens NodePalette modal */}
        <Button
          variant="secondary"
          onClick={onAddNode}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Node
        </Button>

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
            ref={fileInputRef}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
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
    </div>
  );
}

