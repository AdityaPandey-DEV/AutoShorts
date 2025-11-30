'use client';

import { X } from 'lucide-react';

export interface NodeInfo {
  title?: string;
  label?: string;
  description: string;
  features: string[];
  icon?: string;
}

function getNodeTitle(node: NodeInfo): string {
  return node.title || node.label || 'Node';
}

interface NodeInfoModalProps {
  node: NodeInfo | null;
  onClose: () => void;
}

export default function NodeInfoModal({ node, onClose }: NodeInfoModalProps) {
  if (!node) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">{getNodeTitle(node)}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {node.icon && (
            <div className="text-6xl mb-4 text-center">{node.icon}</div>
          )}
          
          <p className="text-gray-700 mb-6 text-lg">{node.description}</p>
          
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Features:</h3>
            <ul className="space-y-2">
              {node.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

