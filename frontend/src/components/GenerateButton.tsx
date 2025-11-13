import React from 'react';

interface GenerateButtonProps {
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  taskState?: string;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  error,
  taskState
}) => {
  const isDisabled = disabled || loading;

  const getButtonText = () => {
    if (!loading) {
      return 'Generate Images';
    }

    if (taskState === 'queuing') {
      return 'Queuing...';
    } else if (taskState === 'generating') {
      return 'Generating...';
    } else if (taskState === 'waiting') {
      return 'Waiting...';
    } else {
      return 'Generating...';
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
          isDisabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            {getButtonText()}
          </span>
        ) : (
          'Generate Images'
        )}
      </button>
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};
