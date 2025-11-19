import React from 'react';

interface EditInstructionsProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export const EditInstructions: React.FC<EditInstructionsProps> = ({
  value,
  onChange,
  disabled = false,
  maxLength = 1000
}) => {
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isAtLimit = charCount >= maxLength;

  return (
    <div className="w-full">
      <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-700 mb-2">
        Edit Instructions
      </label>
      <p className="text-xs text-gray-600 mb-2">
        Describe what you want to change in your images
      </p>

      <textarea
        id="editPrompt"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        disabled={disabled}
        maxLength={maxLength}
        placeholder="e.g., Add a red border, change the background to blue, add text overlay..."
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${disabled
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black'
          } ${isAtLimit ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : ''}`}
        rows={4}
      />

      <div className="mt-2 flex justify-between items-center">
        <span
          className={`text-xs font-medium ${isAtLimit
              ? 'text-red-600'
              : isNearLimit
                ? 'text-yellow-600'
                : 'text-gray-500'
            }`}
        >
          {charCount} / {maxLength} characters
        </span>

        {!disabled && value.trim().length === 0 && (
          <span className="text-xs text-gray-400">Required</span>
        )}
      </div>
    </div>
  );
};
