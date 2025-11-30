'use client';

import { useRef, useState, useEffect } from 'react';
import { Save, Plus, Trash2, Download, Upload, LayoutGrid, Box } from 'lucide-react';
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
  viewMode?: '2d' | '3d';
  onViewModeChange?: (mode: '2d' | '3d') => void;
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
  viewMode = '2d',
  onViewModeChange,
}: FlowchartToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
      <div className={`flex items-center ${isMobile ? 'gap-1 overflow-x-auto scrollbar-hide' : 'justify-between gap-2'}`}>
        {/* Left side actions */}
        <div className={`flex items-center ${isMobile ? 'gap-1 flex-shrink-0' : 'gap-2'}`}>
          {/* Save */}
          <Button
            onClick={onSave}
            disabled={saving}
            className={`flex items-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isMobile ? 'px-2 sm:px-3' : ''
            }`}
            title={isMobile ? (saving ? 'Saving...' : 'Save') : undefined}
          >
            <Save className="w-4 h-4" />
            {!isMobile && (saving ? 'Saving...' : 'Save')}
          </Button>

          {/* Add Node */}
          <Button
            variant="secondary"
            onClick={onAddNode}
            className={`flex items-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isMobile ? 'px-2 sm:px-3' : ''
            }`}
            title={isMobile ? 'Add Node' : undefined}
          >
            <Plus className="w-4 h-4" />
            {!isMobile && 'Add Node'}
          </Button>

          {/* Delete */}
          {selectedNodeId && (
            <Button
              variant="danger"
              onClick={onDeleteSelected}
              className={`flex items-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                isMobile ? 'px-2 sm:px-3' : ''
              }`}
              title={isMobile ? 'Delete' : undefined}
            >
              <Trash2 className="w-4 h-4" />
              {!isMobile && 'Delete'}
            </Button>
          )}
        </div>

        {/* Right side actions */}
        <div className={`flex items-center ${isMobile ? 'gap-1 flex-shrink-0 ml-auto' : 'gap-2'}`}>
          {/* View Toggle */}
          {onViewModeChange && (
            <Button
              variant="secondary"
              onClick={() => onViewModeChange(viewMode === '2d' ? '3d' : '2d')}
              className={`flex items-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                isMobile ? 'px-2 sm:px-3' : ''
              }`}
              title={isMobile ? `Switch to ${viewMode === '2d' ? '3D' : '2D'} view` : undefined}
            >
              {viewMode === '2d' ? (
                <>
                  <Box className="w-4 h-4" />
                  {!isMobile && '3D View'}
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  {!isMobile && '2D View'}
                </>
              )}
            </Button>
          )}

          {/* Export/Import */}
          <Button
            variant="secondary"
            onClick={onExport}
            className={`flex items-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isMobile ? 'px-2 sm:px-3' : ''
            }`}
            title={isMobile ? 'Export' : undefined}
          >
            <Download className="w-4 h-4" />
            {!isMobile && 'Export'}
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
              className={`flex items-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                isMobile ? 'px-2 sm:px-3' : ''
              }`}
              title={isMobile ? 'Import' : undefined}
            >
              <Upload className="w-4 h-4" />
              {!isMobile && 'Import'}
            </Button>
          </label>

          {/* Clear */}
          <Button
            variant="danger"
            onClick={onClear}
            className={`flex items-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isMobile ? 'px-2 sm:px-3' : ''
            }`}
            title={isMobile ? 'Clear' : undefined}
          >
            <Trash2 className="w-4 h-4" />
            {!isMobile && 'Clear'}
          </Button>
        </div>
      </div>
    </div>
  );
}

