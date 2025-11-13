import React, { useState, useEffect } from 'react';
import { StyleSelector, GenerationOptions, StyleOptions } from '../components/StyleSelector.js';
import { ImagePreview } from '../components/ImagePreview.js';
import { GenerateButton } from '../components/GenerateButton.js';
import { ImageDetailModal } from '../components/ImageDetailModal.js';
import { RefinementFormData } from '../components/ImageRefinementForm.js';
import { useGeneration } from '../hooks/useGeneration.js';
import { useImageModal } from '../hooks/useImageModal.js';
import { apiClient } from '../services/apiClient.js';

interface CreateModeProps {
  sessionData?: any;
}

export const CreateMode: React.FC<CreateModeProps> = ({ sessionData }) => {
  const [prompt, setPrompt] = useState('');
  const [styleOptions, setStyleOptions] = useState<StyleOptions>({
    size: sessionData?.preferredSize || '1024x768',
    style: sessionData?.preferredStyle || 'default',
    aspectRatio: sessionData?.preferredAspectRatio || '16:9'
  });
  const [options, setOptions] = useState<GenerationOptions | null>(null);
  const { images, loading, error, taskState, generate, clearError } = useGeneration();
  const imageModal = useImageModal();

  // Load generation options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await apiClient.getGenerationOptions();
        setOptions(opts);
      } catch (err) {
        console.error('Failed to load generation options:', err);
      }
    };

    loadOptions();
  }, []);

  const handleGenerateClick = async () => {
    if (!prompt.trim()) {
      return;
    }

    await generate({
      prompt: prompt.trim(),
      size: styleOptions.size,
      style: styleOptions.style,
      aspectRatio: styleOptions.aspectRatio
    });
  };

  const handleDownload = async (image: any) => {
    try {
      // Use backend endpoint to handle download (bypasses CORS)
      const response = await apiClient.downloadImage(image.url);

      // Create blob from response
      const blob = new Blob([response], { type: 'image/png' });
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `nano-banana-${image.id.substring(0, 8)}.${image.format}`;
      downloadLink.style.display = 'none';

      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Cleanup blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Unable to download image. Please try again.');
    }
  };

  const handleImageClick = (image: any) => {
    console.log('Image clicked, opening modal with:', image.id);
    console.log('Current modal state:', {
      isOpen: imageModal.isOpen,
      refinementResults: imageModal.refinementResults.length
    });
    imageModal.openModal(image);
  };

  const handleRefinedImageEdit = (refinedImage: any) => {
    console.log('Refined image edit requested:', refinedImage.id);
    // Set the refined image as the selected image
    imageModal.openModal(refinedImage);
    // Open the refinement form immediately
    imageModal.openRefinementForm();
  };

  const handleRefinement = async (data: RefinementFormData) => {
    if (!imageModal.selectedImage) return;

    try {
      imageModal.setRefinementLoading(true);
      imageModal.setRefinementError(null);

      const result = await apiClient.refineImage({
        imageUrl: imageModal.selectedImage.url,
        editPrompt: data.refinementPrompt,
        style: data.style,
        aspectRatio: data.aspectRatio
      });

      // Handle the response - result should have taskId for polling
      if (result.taskId) {
        // Poll for refinement task status
        await pollRefinementStatus(result.taskId);
      } else if (result.images) {
        imageModal.setRefinementResults(result.images);
        imageModal.setRefinementPrompt('');
      } else if (result.variants) {
        imageModal.setRefinementResults(result.variants);
        imageModal.setRefinementPrompt('');
      }
    } catch (error) {
      console.error('Refinement failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refine image';
      imageModal.setRefinementError(errorMessage);
    } finally {
      imageModal.setRefinementLoading(false);
    }
  };

  const pollRefinementStatus = async (taskId: string, maxAttempts = 120) => {
    let attempts = 0;
    const pollInterval = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      try {
        const status = await apiClient.getRefinementStatus(taskId);

        if (status.status === 'completed' && status.variants) {
          imageModal.setRefinementResults(status.variants);
          imageModal.setRefinementPrompt('');
          imageModal.closeRefinementForm(); // Hide the form and show results
          return;
        } else if (status.status === 'failed') {
          throw new Error(status.details || 'Refinement failed');
        }

        // Still pending, wait and retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (error) {
        console.error('Status check error:', error);
        throw error;
      }
    }

    throw new Error('Refinement task timed out');
  };

  const isPromptValid = prompt.trim().length > 0 && prompt.length <= 1000;

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Create from Text
        </h2>

        {/* Prompt Input */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              placeholder="Describe the image you want to generate..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between mt-2">
              <p className="text-xs text-gray-500">
                {isPromptValid ? (
                  <span className="text-green-600">✓ Ready to generate</span>
                ) : prompt.length > 1000 ? (
                  <span className="text-red-600">Prompt too long</span>
                ) : (
                  <span>Enter your prompt to begin</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {prompt.length}/1000
              </p>
            </div>
          </div>
        </div>

        {/* Style Options */}
        {options && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Options
            </h3>
            <StyleSelector
              options={options}
              initialValues={styleOptions}
              onChange={setStyleOptions}
              disabled={loading}
            />
          </div>
        )}

        {/* Generate Button */}
        <GenerateButton
          onClick={handleGenerateClick}
          loading={loading}
          disabled={!isPromptValid || loading}
          error={error ?? undefined}
          taskState={taskState ?? undefined}
        />

        {/* Clear Error Button */}
        {error && (
          <button
            onClick={clearError}
            className="mt-2 w-full px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Dismiss error
          </button>
        )}

        {/* Recent Prompts */}
        {sessionData?.recentPrompts && sessionData.recentPrompts.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Recent Prompts
            </h3>
            <div className="space-y-2">
              {sessionData.recentPrompts.map((recentPrompt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(recentPrompt)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {recentPrompt.length > 50
                    ? recentPrompt.substring(0, 47) + '...'
                    : recentPrompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {images.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <ImagePreview
            images={images}
            onDownload={handleDownload}
            onImageClick={handleImageClick}
            loading={false}
          />
        </div>
      )}

      {/* Created Images Gallery */}
      {images.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Created Images</h2>
            <span className="text-sm text-gray-500">
              {images.length} {images.length === 1 ? 'image' : 'images'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                {/* Image Container */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Created image ${image.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12" font-family="system-ui"%3EImage Failed to Load%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold text-center">
                      <div className="text-2xl mb-2">🔍</div>
                      <div className="text-sm">View Details</div>
                    </div>
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-3 bg-white">
                  <p className="text-xs text-gray-500 truncate">
                    {image.width}x{image.height} ({image.format})
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-1">{image.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      <ImageDetailModal
        isOpen={imageModal.isOpen}
        image={imageModal.selectedImage}
        onClose={imageModal.closeModal}
        onDownload={handleDownload}
        onRefineClick={imageModal.openRefinementForm}
        onRefinedImageEdit={handleRefinedImageEdit}
        showRefinementForm={imageModal.showRefinementForm}
        onRefinementSubmit={handleRefinement}
        refinementLoading={imageModal.refinementLoading}
        refinementError={imageModal.refinementError}
        refinementResults={imageModal.refinementResults}
      />
    </div>
  );
};
