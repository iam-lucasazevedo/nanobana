import React from 'react';

type Mode = 'generation' | 'edit';

interface ModeSelectorProps {
  activeMode: Mode;
  onModeChange: (mode: Mode) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  onModeChange,
  disabled = false,
  showLabels = true
}) => {
  const modes: { id: Mode; label: string; icon: string; description: string }[] = [
    {
      id: 'generation',
      label: 'Create Images',
      icon: '✨',
      description: 'Generate images from text prompts'
    },
    {
      id: 'edit',
      label: 'Edit Images',
      icon: '🖼️',
      description: 'Edit and transform existing images'
    }
  ];

  return (
    <div className="flex items-center gap-2 border-b border-gray-200">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          disabled={disabled}
          className={`px-6 py-3 font-medium border-b-2 transition-all duration-200 flex items-center gap-2 group ${
            activeMode === mode.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={mode.description}
        >
          <span className="text-lg">{mode.icon}</span>
          {showLabels && <span>{mode.label}</span>}
        </button>
      ))}
    </div>
  );
};
