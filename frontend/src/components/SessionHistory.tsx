import React, { useState } from 'react';

interface HistoryItem {
  id: string;
  type: 'generation' | 'edit';
  prompt: string;
  timestamp: string;
  metadata?: {
    size?: string;
    style?: string;
    aspectRatio?: string;
  };
}

interface SessionHistoryProps {
  recentPrompts: string[];
  recentEditPrompts: string[];
  generationHistory?: any[];
  editHistory?: any[];
  onPromptSelect: (prompt: string, type: 'generation' | 'edit', metadata?: any) => void;
  maxItems?: number;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  recentPrompts,
  recentEditPrompts,
  generationHistory = [],
  editHistory = [],
  onPromptSelect,
  maxItems = 5
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Combine and deduplicate recent items
  const combinedHistory: HistoryItem[] = [];

  // Add generation history
  generationHistory.slice(0, maxItems).forEach((item, index) => {
    combinedHistory.push({
      id: `gen-${index}`,
      type: 'generation',
      prompt: item.prompt,
      timestamp: item.created_at,
      metadata: {
        size: item.size,
        style: item.style,
        aspectRatio: item.aspect_ratio
      }
    });
  });

  // Add edit history
  editHistory.slice(0, maxItems).forEach((item, index) => {
    combinedHistory.push({
      id: `edit-${index}`,
      type: 'edit',
      prompt: item.edit_prompt,
      timestamp: item.created_at,
      metadata: {
        style: item.style
      }
    });
  });

  // Sort by timestamp (newest first)
  combinedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleSelect = (item: HistoryItem) => {
    onPromptSelect(item.prompt, item.type, item.metadata);
    setIsOpen(false);
  };

  if (combinedHistory.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        title="View recent prompts"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Recent ({combinedHistory.length})</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Recent Prompts</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {combinedHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className={`text-lg flex-shrink-0 ${
                    item.type === 'generation' ? '✨' : '🖼️'
                  }`}></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.prompt}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.type === 'generation' ? 'Generation' : 'Edit'}
                      {item.metadata?.style && ` • ${item.metadata.style}`}
                      {item.metadata?.size && ` • ${item.metadata.size}`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
