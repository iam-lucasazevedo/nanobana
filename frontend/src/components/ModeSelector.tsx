import React from 'react';

interface ModeSelectorProps {
  activeMode: 'generation' | 'edit';
  onModeChange: (mode: 'generation' | 'edit') => void;
  showLabels?: boolean;
}

export function ModeSelector({ activeMode, onModeChange, showLabels = true }: ModeSelectorProps) {
  return (
    <div className="glass p-1 rounded-lg inline-flex relative">
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-md transition-all duration-300 ease-out ${activeMode === 'edit' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
          }`}
      />

      <button
        onClick={() => onModeChange('generation')}
        className={`relative z-10 px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${activeMode === 'generation' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {showLabels && "Generate"}
        </span>
      </button>

      <button
        onClick={() => onModeChange('edit')}
        className={`relative z-10 px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${activeMode === 'edit' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {showLabels && "Edit"}
        </span>
      </button>
    </div>
  );
}
