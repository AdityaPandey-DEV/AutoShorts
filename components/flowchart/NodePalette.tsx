'use client';

import { useState, useMemo } from 'react';
import { NODE_TYPES_ARRAY, FlowchartNodeType } from './NodeTypes';
import { Search, X } from 'lucide-react';

interface NodePaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeType: string) => void;
}

export default function NodePalette({ isOpen, onClose, onSelectNode }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['input', 'process', 'output', 'condition', 'action'];

  const filteredNodes = useMemo(() => {
    let filtered = NODE_TYPES_ARRAY;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(node => node.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(node =>
        node.name.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Add Node</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 py-2 border-b border-gray-600 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-blue-500 text-white'
                : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredNodes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No nodes found matching "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredNodes.map((nodeType) => (
                <button
                  key={nodeType.id}
                  onClick={() => {
                    onSelectNode(nodeType.id);
                    onClose();
                  }}
                  className="text-left p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#333] transition-colors border border-transparent hover:border-gray-600"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{nodeType.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{nodeType.name}</div>
                      <div className="text-sm text-gray-400 mt-1">{nodeType.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-xs px-2 py-0.5 rounded capitalize"
                          style={{
                            backgroundColor: nodeType.color + '20',
                            color: nodeType.color,
                          }}
                        >
                          {nodeType.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

