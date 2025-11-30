'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Save, Plus, Trash2, Download, Upload, LayoutGrid, Box, Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface FlowchartHeaderProps {
  flowchartName: string;
  onFlowchartNameChange: (name: string) => void;
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

export default function FlowchartHeader({
  flowchartName,
  onFlowchartNameChange,
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
}: FlowchartHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch('/api/admin/auth/check')
      .then(res => res.json())
      .then(data => setIsAdmin(data.isAdmin || false))
      .catch(() => setIsAdmin(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        {/* Top Bar: Logo, Flowchart Name, Menu */}
        <header className="bg-black shadow-sm border-b border-gray-600">
          <div className="flex items-center justify-between px-3 py-2 gap-2">
            <Link href="/dashboard" className="text-xl font-bold text-red-600 flex-shrink-0">
              AutoShorts
            </Link>
            <input
              type="text"
              value={flowchartName}
              onChange={(e) => onFlowchartNameChange(e.target.value)}
              className="flex-1 text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-gray-500 min-w-0"
              placeholder="Flowchart Name"
            />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2 hover:bg-gray-800 rounded transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-600 bg-black">
              <div className="px-3 py-2 space-y-1">
                <Link href="/dashboard" className="block text-white hover:text-red-500 transition-colors py-2">
                  Dashboard
                </Link>
                <Link href="/pricing" className="block text-white hover:text-red-500 transition-colors py-2">
                  Pricing
                </Link>
                <Link href="/settings" className="block text-white hover:text-red-500 transition-colors py-2">
                  Settings
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="block text-red-600 hover:text-red-500 transition-colors py-2">
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-white hover:text-red-500 transition-colors py-2"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Second Bar: Toolbar Buttons */}
        <div className="bg-[#2a2a2a] border-b border-gray-600">
          <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
            <Button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1 px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
              title={saving ? 'Saving...' : 'Save'}
            >
              <Save className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="secondary"
              onClick={onAddNode}
              className="flex items-center gap-1 px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
              title="Add Node"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>

            {selectedNodeId && (
              <Button
                variant="danger"
                onClick={onDeleteSelected}
                className="flex items-center gap-1 px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}

            {onViewModeChange && (
              <Button
                variant="secondary"
                onClick={() => onViewModeChange(viewMode === '2d' ? '3d' : '2d')}
                className="flex items-center gap-1 px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
                title={`Switch to ${viewMode === '2d' ? '3D' : '2D'} view`}
              >
                {viewMode === '2d' ? (
                  <Box className="w-3.5 h-3.5" />
                ) : (
                  <LayoutGrid className="w-3.5 h-3.5" />
                )}
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={onExport}
              className="flex items-center gap-1 px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
              title="Export"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>

            <label className="cursor-pointer flex-shrink-0">
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
                className="flex items-center gap-1 px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
                title="Import"
              >
                <Upload className="w-3.5 h-3.5" />
              </Button>
            </label>

            <Button
              variant="danger"
              onClick={onClear}
              className="flex items-center gap-1 px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      {/* Top Bar: Logo, Flowchart Name, Navigation Links, Logout */}
      <header className="bg-black shadow-sm border-b border-gray-600">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Left: Logo */}
            <Link href="/dashboard" className="text-xl font-bold text-red-600 flex-shrink-0">
              AutoShorts
            </Link>

            {/* Center: Flowchart Name */}
            <input
              type="text"
              value={flowchartName}
              onChange={(e) => onFlowchartNameChange(e.target.value)}
              className="flex-1 max-w-xs text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-gray-500"
              placeholder="Flowchart Name"
            />

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-3 flex-shrink-0">
              <Link href="/dashboard" className={`text-sm transition-colors ${
                pathname === '/dashboard' ? 'text-red-500' : 'text-white hover:text-red-500'
              }`}>
                Dashboard
              </Link>
              <Link href="/pricing" className={`text-sm transition-colors ${
                pathname === '/pricing' ? 'text-red-500' : 'text-white hover:text-red-500'
              }`}>
                Pricing
              </Link>
              <Link href="/settings" className={`text-sm transition-colors ${
                pathname === '/settings' ? 'text-red-500' : 'text-white hover:text-red-500'
              }`}>
                Settings
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-red-600 hover:text-red-500 font-medium transition-colors">
                  Admin
                </Link>
              )}
            </nav>

            {/* Right: Logout */}
            <button
              onClick={handleLogout}
              className="text-white hover:text-red-500 transition-colors px-3 py-1.5 text-sm flex-shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Second Bar: Toolbar Buttons */}
      <div className="bg-[#2a2a2a] border-b border-gray-600">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 h-12">
            <Button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>

            <Button
              variant="secondary"
              onClick={onAddNode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </Button>

            {selectedNodeId && (
              <Button
                variant="danger"
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}

            {onViewModeChange && (
              <Button
                variant="secondary"
                onClick={() => onViewModeChange(viewMode === '2d' ? '3d' : '2d')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title={`Switch to ${viewMode === '2d' ? '3D' : '2D'} view`}
              >
                {viewMode === '2d' ? (
                  <>
                    <Box className="w-4 h-4" />
                    3D View
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    2D View
                  </>
                )}
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </label>

            <Button
              variant="danger"
              onClick={onClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
