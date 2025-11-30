'use client';

import { Variable, Settings, MessageSquare } from 'lucide-react';

interface MobileTabNavigationProps {
  activeTab: 'variables' | 'properties' | 'ai';
  onTabChange: (tab: 'variables' | 'properties' | 'ai') => void;
}

export default function MobileTabNavigation({
  activeTab,
  onTabChange,
}: MobileTabNavigationProps) {
  const tabs = [
    { id: 'variables' as const, label: 'Variables', icon: Variable },
    { id: 'properties' as const, label: 'Properties', icon: Settings },
    { id: 'ai' as const, label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <div className="flex border-b border-gray-600 bg-[#2a2a2a]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-all duration-200 touch-manipulation ${
              isActive
                ? 'text-blue-400 border-b-2 border-blue-400 bg-[#1a1a1a]'
                : 'text-gray-400 hover:text-gray-300 active:bg-[#333]'
            }`}
            aria-label={tab.label}
          >
            <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

