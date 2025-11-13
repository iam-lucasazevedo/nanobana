import React, { useState } from 'react';
import { apiClient } from '../services/apiClient.js';
import { EditImageDetailModal } from './EditImageDetailModal.js';

export interface EditedImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
}

interface EditedImagePreviewProps {
  images: EditedImage[];
  onClear?: () => void;
  onRefinedImage?: (image: EditedImage) => void;
}

export const EditedImagePreview: React.FC<EditedImagePreviewProps> = ({
  images,
  onClear,
  onRefinedImage
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<EditedImage | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDownload = async (image: EditedImage) => {
    try {
      setDownloadingId(image.id);

      // Use backend endpoint to handle download (bypasses CORS)
      const response = await apiClient.downloadImage(image.url);

      // Create blob from response
      const blob = new Blob([response], { type: 'image/png' });
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `edited-${image.id}.${image.format || 'png'}`;
      downloadLink.style.display = 'none';

      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Cleanup blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Edited Images ({images.length})
        </h3>
        {onClear && (
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => {
              setSelectedImage(image);
              setShowModal(true);
            }}
          >
            {/* Image */}
            <img
              src={image.url}
              alt={`Edited result ${image.id}`}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2">
              {/* Download Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image);
                }}
                disabled={downloadingId === image.id}
                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 ${
                  downloadingId === image.id
                    ? 'bg-gray-500 cursor-wait'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                title="Download image"
              >
                {downloadingId === image.id ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
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
                    Downloading...
                  </>
                ) : (
                  <>
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>

            {/* Image info */}
            {(image.width || image.height) && (
              <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                {image.width && image.height && `${image.width}x${image.height}`}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          ✓ All images processed successfully! You can download them individually or click to refine further.
        </p>
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <EditImageDetailModal
          isOpen={showModal}
          image={selectedImage}
          onClose={() => {
            setShowModal(false);
            setSelectedImage(null);
          }}
          onDownload={handleDownload}
          onRefineImage={onRefinedImage}
        />
      )}
    </div>
  );
};
