'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CanvasNavigationControlsProps {
  onPan: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onZoom: (direction: 'in' | 'out') => void;
  onReset: () => void;
  viewMode: '2d' | '3d';
}

export default function CanvasNavigationControls({
  onPan,
  onZoom,
  onReset,
  viewMode,
}: CanvasNavigationControlsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device is mobile/touch device
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't show buttons on desktop/PC
  if (!isMobile) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
      {/* Arrow Navigation */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => onPan('up')}
          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg shadow-lg transition-colors touch-manipulation"
          aria-label="Pan up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => onPan('left')}
            className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg shadow-lg transition-colors touch-manipulation"
            aria-label="Pan left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onPan('right')}
            className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg shadow-lg transition-colors touch-manipulation"
            aria-label="Pan right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => onPan('down')}
          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg shadow-lg transition-colors touch-manipulation"
          aria-label="Pan down"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* Zoom and Reset Controls */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => onZoom('out')}
          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg shadow-lg transition-colors touch-manipulation"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={onReset}
          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg shadow-lg transition-colors touch-manipulation"
          aria-label="Reset view"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => onZoom('in')}
          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg shadow-lg transition-colors touch-manipulation"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

