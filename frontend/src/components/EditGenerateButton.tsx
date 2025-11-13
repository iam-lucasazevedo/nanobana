import React from 'react';

interface EditGenerateButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  taskState?: string;
  uploadedFilesCount?: number;
  editPromptEmpty?: boolean;
}

export const EditGenerateButton: React.FC<EditGenerateButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  taskState,
  uploadedFilesCount = 0,
  editPromptEmpty = true
}) => {
  const isDisabled =
    disabled ||
    loading ||
    uploadedFilesCount === 0 ||
    editPromptEmpty;

  const getButtonText = () => {
    if (loading) {
      if (taskState === 'uploading') return 'Uploading images...';
      if (taskState === 'processing') return 'Processing edits...';
      return 'Generating...';
    }
    return 'Generate Variants';
  };

  const getTooltip = () => {
    if (uploadedFilesCount === 0) return 'Upload images to get started';
    if (editPromptEmpty) return 'Enter edit instructions';
    if (isDisabled && !loading) return 'Processing in progress...';
    return 'Generate edited image variants';
  };

  return (
    <div className="w-full">
      <button
        onClick={onClick}
        disabled={isDisabled}
        title={getTooltip()}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
          isDisabled
            ? 'bg-gray-400 cursor-not-allowed opacity-60'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg'
        }`}
      >
        {loading && (
          <svg
            className="animate-spin w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!loading && (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )}

        <span>{getButtonText()}</span>
      </button>

      {/* Help text */}
      <div className="mt-3 flex items-start gap-2">
        <svg
          className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-xs text-gray-600">
          {uploadedFilesCount === 0
            ? 'Upload 1-10 images to start editing'
            : editPromptEmpty
            ? 'Describe what you want to change in your images'
            : `Ready to edit ${uploadedFilesCount} image${uploadedFilesCount !== 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
};
