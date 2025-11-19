import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from '../components/FileUpload.js';
import { EditInstructions } from '../components/EditInstructions.js';
import { UploadedImagePreview } from '../components/UploadedImagePreview.js';
import { EditedImagePreview, EditedImage } from '../components/EditedImagePreview.js';
import { EnhancePromptButton } from '../components/EnhancePromptButton.js';
import { EditGenerateButton } from '../components/EditGenerateButton.js';
import { useImageEdit } from '../hooks/useImageEdit.js';
import { useGeneration } from '../hooks/useGeneration.js';
import { apiClient } from '../services/apiClient.js';

interface EditModeProps {
  sessionData?: any;
}

export const EditMode: React.FC<EditModeProps> = ({ sessionData }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [style, setStyle] = useState(sessionData?.preferredStyle || 'default');
  const [aspectRatio, setAspectRatio] = useState(
    sessionData?.preferredAspectRatio || '1:1'
  );
  const [editOptions, setEditOptions] = useState<any>(null);
  const {
    uploadedFiles,
    editedImages,
    loading,
    error,
    taskState,
    addFiles,
    removeFile,
    clearFiles,
    editImages,
    clearImages,
    clearError
  } = useImageEdit();

  // Load edit options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await apiClient.getEditOptions();
        setEditOptions(opts);
      } catch (err) {
        console.error('Failed to load edit options:', err);
      }
    };

    loadOptions();
  }, []);

  const handleEditClick = async () => {
    if (!editPrompt.trim()) {
      return;
    }

    await editImages(editPrompt.trim(), style, aspectRatio);
  };

  const handleEditPromptEnhanced = useCallback((enhancedPrompt: string) => {
    setEditPrompt(enhancedPrompt);
  }, []);

  const handleClearAll = () => {
    clearFiles();
    setEditPrompt('');
    clearImages();
    clearError();
  };

  const handleRefinedImage = (image: EditedImage) => {
    // When user clicks "Refine This Image", set it up for the refinement flow
    // For now, just scroll to the top and focus on the edit prompt
    setEditPrompt('');
    // This would need to be connected to a refinement modal similar to CreateMode
    // For Edit mode, we can trigger a refinement of the edited image
  };

  const isEditPromptValid =
    editPrompt.trim().length > 0 && editPrompt.length <= 1000;

  return (
    <div className="space-y-8">
      {/* Main Edit Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Edit Existing Images</h2>
          {(uploadedFiles.length > 0 || editPrompt) && (
            <button
              onClick={handleClearAll}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-8">
          {/* File Upload Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Upload Images</h3>
            <FileUpload
              onFilesSelected={addFiles}
              disabled={loading}
              maxFiles={10}
            />
            <UploadedImagePreview
              files={uploadedFiles}
              onRemove={removeFile}
              disabled={loading}
            />
          </div>

          {/* Edit Instructions Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Describe Your Edits</h3>
            <EditInstructions
              value={editPrompt}
              onChange={setEditPrompt}
              disabled={loading}
              maxLength={1000}
            />
            <div className="mt-4 flex gap-3">
              <EnhancePromptButton
                prompt={editPrompt}
                onPromptEnhanced={handleEditPromptEnhanced}
                onError={(error) => console.error('Enhancement error:', error)}
                buttonText="Enhance Prompt"
                loadingText="Enhancing..."
                className="flex-1"
              />
            </div>
          </div>

          {/* Edit Options Section */}
          {editOptions && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Choose Options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {/* Style Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black"
                  >
                    {editOptions.styles?.map((s: string) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black"
                  >
                    {editOptions.aspectRatios?.map((ar: string) => (
                      <option key={ar} value={ar}>
                        {ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Generate</h3>
            <EditGenerateButton
              onClick={handleEditClick}
              loading={loading}
              disabled={loading}
              taskState={taskState}
              uploadedFilesCount={uploadedFiles.length}
              editPromptEmpty={!isEditPromptValid}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                  <button
                    onClick={clearError}
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {editedImages.length > 0 && (
        <EditedImagePreview
          images={editedImages as EditedImage[]}
          onClear={clearImages}
          onRefinedImage={handleRefinedImage}
        />
      )}
    </div>
  );
};
