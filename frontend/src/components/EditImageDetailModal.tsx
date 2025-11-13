import React, { useEffect, useRef, useState } from 'react';
import { ImageRefinementForm, RefinementFormData } from './ImageRefinementForm.js';
import { EditedImage } from './EditedImagePreview.js';
import { apiClient } from '../services/apiClient.js';

interface RefinementResult {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

interface EditImageDetailModalProps {
  isOpen: boolean;
  image: EditedImage | null;
  onClose: () => void;
  onDownload?: (image: EditedImage) => void;
  onRefineImage?: (image: EditedImage) => void;
}

export const EditImageDetailModal: React.FC<EditImageDetailModalProps> = ({
  isOpen,
  image,
  onClose,
  onDownload,
  onRefineImage
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showRefinementForm, setShowRefinementForm] = useState(false);
  const [refinementLoading, setRefinementLoading] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [refinementResults, setRefinementResults] = useState<RefinementResult[]>([]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!image) return;

    try {
      if (onDownload) {
        onDownload(image);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleRefinement = async (data: RefinementFormData) => {
    if (!image) return;

    try {
      setRefinementLoading(true);
      setRefinementError(null);

      const result = await apiClient.refineImage({
        imageUrl: image.url,
        editPrompt: data.refinementPrompt,
        style: data.style,
        aspectRatio: data.aspectRatio
      });

      // Handle the response - result should have taskId for polling
      if (result.taskId) {
        // Poll for refinement task status
        await pollRefinementStatus(result.taskId);
      } else if (result.images) {
        setRefinementResults(result.images);
      } else if (result.variants) {
        setRefinementResults(result.variants);
      }
    } catch (error) {
      console.error('Refinement failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refine image';
      setRefinementError(errorMessage);
    } finally {
      setRefinementLoading(false);
    }
  };

  const pollRefinementStatus = async (taskId: string, maxAttempts = 120) => {
    let attempts = 0;
    const pollInterval = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      try {
        const status = await apiClient.getRefinementStatus(taskId);

        if (status.status === 'completed' && status.variants) {
          setRefinementResults(status.variants);
          setShowRefinementForm(false); // Hide the form and show results
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

  if (!isOpen || !image) {
    return null;
  }

  // Display refinement results
  if (refinementResults.length > 0 && !showRefinementForm) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-gray-900">Refined Images</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="p-6">
            {refinementResults.map((result) => (
              <div key={result.id} className="space-y-6">
                {/* Comparison Container */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Original Image */}
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Original</label>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={image?.url}
                        alt="Original image"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12" font-family="system-ui"%3EImage Failed to Load%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>

                  {/* Refined Image */}
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Refined</label>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={result.url}
                        alt="Refined image"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12" font-family="system-ui"%3EImage Failed to Load%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Image Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Resolution:</span> {result.width}x{result.height} ({result.format})
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (onDownload) {
                        onDownload({
                          id: result.id,
                          url: result.url,
                          width: result.width,
                          height: result.height,
                          format: result.format
                        });
                      }
                    }}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📥</span>
                    Download Refined Image
                  </button>
                  <button
                    onClick={() => {
                      const refinedImage: EditedImage = {
                        id: result.id,
                        url: result.url,
                        width: result.width,
                        height: result.height,
                        format: result.format
                      };
                      setRefinementResults([]);
                      setShowRefinementForm(true);
                      // Update image to refined version
                      Object.assign(image, refinedImage);
                    }}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✨</span>
                    Refine Further
                  </button>
                </div>

                {/* Back Button */}
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Back
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Display refinement form
  if (showRefinementForm) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-gray-900">Refine Image</h2>
            <button
              onClick={onClose}
              disabled={refinementLoading}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none disabled:opacity-50"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Content: Image Preview on Left, Form on Right */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Current Image Preview */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">Current Image</label>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={image?.url}
                    alt="Current image"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12" font-family="system-ui"%3EImage Failed to Load%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>

              {/* Right: Form */}
              <div className="flex flex-col">
                <ImageRefinementForm
                  onSubmit={handleRefinement}
                  onCancel={() => {
                    setShowRefinementForm(false);
                    setRefinementResults([]);
                  }}
                  loading={refinementLoading}
                  error={refinementError}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display main image view with options
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Image Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-6">
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-6">
            <img
              src={image.url}
              alt="Image details"
              className="w-full h-auto object-contain max-h-96"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16" font-family="system-ui"%3EImage Failed to Load%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Image Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Image Information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Dimensions:</dt>
                <dd className="text-gray-600">
                  {image.width} × {image.height} pixels
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Format:</dt>
                <dd className="text-gray-600 uppercase">{image.format}</dd>
              </div>
              {image.id && (
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">ID:</dt>
                  <dd className="text-gray-600 font-mono text-xs truncate">
                    {image.id}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>📥</span>
              Download Image
            </button>
            <button
              onClick={() => {
                setShowRefinementForm(true);
              }}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>✨</span>
              Refine This Image
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-3 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
