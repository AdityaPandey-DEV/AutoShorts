'use client';

import { X, Brain, Video, Upload, TrendingUp } from 'lucide-react';

export interface NodeInfo {
  title?: string;
  label?: string;
  description: string;
  features: string[];
  icon?: string;
  iconType?: string;
  color?: string;
}

function getNodeTitle(node: NodeInfo): string {
  return node.title || node.label || 'Node';
}

function getNodeIcon(node: NodeInfo) {
  const iconType = node.iconType || node.label?.toLowerCase().replace(/\s+/g, '-') || '';
  
  const iconProps = { className: 'w-12 h-12', strokeWidth: 2.5 };
  
  switch (iconType) {
    case 'ai-thinking':
      return <Brain {...iconProps} />;
    case 'video-creator':
      return <Video {...iconProps} />;
    case 'youtube-upload':
    case 'auto-upload':
      return <Upload {...iconProps} />;
    case 'feedback-loop':
    case 'smart-learning':
      return <TrendingUp {...iconProps} />;
    default:
      return node.icon ? <span className="text-5xl">{node.icon}</span> : null;
  }
}

function getNodeColor(node: NodeInfo): string {
  return node.color || '#DC2626';
}

function getNodeBgColor(node: NodeInfo): string {
  const color = getNodeColor(node);
  if (color === '#16A34A' || color === '#16A34A') {
    return 'bg-green-50';
  }
  return 'bg-red-50';
}

function getNodeIconColor(node: NodeInfo): string {
  const color = getNodeColor(node);
  if (color === '#16A34A') {
    return 'text-green-600';
  }
  return 'text-red-600';
}

interface NodeInfoModalProps {
  node: NodeInfo | null;
  onClose: () => void;
}

export default function NodeInfoModal({ node, onClose }: NodeInfoModalProps) {
  if (!node) return null;

  const iconElement = getNodeIcon(node);
  const bgColor = getNodeBgColor(node);
  const iconColor = getNodeIconColor(node);
  const borderColor = node.color || '#DC2626';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div 
          className="sticky top-0 px-6 py-5 flex justify-between items-center border-b"
          style={{ 
            borderBottomColor: borderColor,
            borderBottomWidth: '3px'
          }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-black">{getNodeTitle(node)}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {/* Icon */}
          {iconElement && (
            <div className={`inline-flex items-center justify-center w-20 h-20 ${bgColor} rounded-xl mb-6 mx-auto`}>
              <div className={iconColor}>
                {iconElement}
              </div>
            </div>
          )}
          
          {/* Description */}
          <p className="text-gray-700 mb-8 text-lg leading-relaxed text-center max-w-2xl mx-auto">
            {node.description}
          </p>
          
          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-black mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-600 rounded-full"></span>
              Key Features
            </h3>
            <ul className="space-y-3">
              {node.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <div className={`flex-shrink-0 mt-1 w-6 h-6 rounded-full ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <span className="text-green-600 text-sm font-bold">✓</span>
                  </div>
                  <span className="text-gray-700 text-base leading-relaxed flex-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

