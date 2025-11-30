'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { FlowchartAIChatMessage } from '@/src/services/flowchartAI';

interface AIChatAssistantProps {
  onApplySuggestion?: (suggestion: any) => void;
  currentFlowchart: {
    nodes: Array<{ id: string; type: string; label?: string; position: [number, number, number] }>;
    connections: Array<{ from: string; to: string }>;
  };
}

export default function AIChatAssistant({ onApplySuggestion, currentFlowchart }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<FlowchartAIChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm here to help you create your automation flowchart. You can ask me to add nodes, connect them, or explain how your automation should work.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: FlowchartAIChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/flowchart/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          currentFlowchart,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: FlowchartAIChatMessage = {
          role: 'assistant',
          content: data.response,
          suggestions: data.suggestions || [],
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get AI response'}`,
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to connect to AI. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    onApplySuggestion?.(suggestion);
  };

  return (
    <div className="flex flex-col h-full bg-[#2a2a2a]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-red-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-200 border border-gray-600'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="block w-full text-left text-xs bg-[#2a2a2a] text-red-400 px-3 py-2 rounded border border-red-600 hover:bg-red-900/20 transition-colors"
                    >
                      💡 {suggestion.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-200" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask AI to help create your flowchart..."
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Try: "Add an AI thinking node" or "How should I connect these nodes?"
        </p>
      </div>
    </div>
  );
}




