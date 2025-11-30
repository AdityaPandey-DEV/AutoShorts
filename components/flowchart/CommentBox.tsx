'use client';

import { useState, useRef, useEffect } from 'react';
import { CommentBox as CommentBoxType } from '@/src/types/flowchart';

interface CommentBoxProps {
  comment: CommentBoxType;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<CommentBoxType>) => void;
  onDelete: (id: string) => void;
}

export default function CommentBox({
  comment,
  isSelected,
  zoom,
  onSelect,
  onUpdate,
  onDelete,
}: CommentBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(comment.text);
  }, [comment.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleTextChange = (newText: string) => {
    setText(newText);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    if (text !== comment.text) {
      onUpdate(comment.id, { text });
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: comment.size[0],
      height: comment.size[1],
    });
  };

  useEffect(() => {
    if (isResizing && resizeStart) {
      const handleMouseMove = (e: MouseEvent) => {
        const dx = (e.clientX - resizeStart.x) / zoom;
        const dy = (e.clientY - resizeStart.y) / zoom;
        onUpdate(comment.id, {
          size: [
            Math.max(200, resizeStart.width + dx),
            Math.max(100, resizeStart.height + dy),
          ] as [number, number],
        });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeStart(null);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeStart, comment.id, zoom, onUpdate]);

  const color = comment.color || '#FFA500';

  return (
    <div
      className={`absolute border-2 rounded-lg cursor-move transition-shadow ${
        isSelected ? 'shadow-lg' : 'shadow-md'
      }`}
      style={{
        left: comment.position[0],
        top: comment.position[1],
        width: comment.size[0],
        minHeight: comment.size[1],
        backgroundColor: color + '15',
        borderColor: isSelected ? color : color + '60',
        transform: `scale(${Math.max(0.5, Math.min(2, zoom))})`,
        transformOrigin: 'top left',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: color + '40' }}
      >
        <span className="text-sm font-semibold text-gray-200">Comment</span>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(comment.id);
            }}
            className="text-red-400 hover:text-red-300 text-xs px-1"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setText(comment.text);
                setIsEditing(false);
              }
              e.stopPropagation();
            }}
            className="w-full bg-transparent text-gray-200 text-sm resize-none focus:outline-none"
            style={{ minHeight: comment.size[1] - 60 }}
          />
        ) : (
          <div className="text-gray-200 text-sm whitespace-pre-wrap break-words">
            {text || 'Double-click to edit'}
          </div>
        )}
      </div>

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{
            backgroundColor: color,
            clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
          }}
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}

