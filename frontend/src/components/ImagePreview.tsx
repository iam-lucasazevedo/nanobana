import React from 'react';

export interface ImageData {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

interface ImagePreviewProps {
  images: ImageData[];
  onDownload?: (image: ImageData) => void;
  onImageClick?: (image: ImageData) => void;
  loading?: boolean;
  error?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  onDownload,
  onImageClick,
  loading = false,
  error
}) => {
  const handleDownload = (image: ImageData) => {
    if (onDownload) {
      onDownload(image);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `image-${image.id}.${image.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 mt-4">Generating images...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-600">No images generated yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Generate images to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Generated Images</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div
              className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer"
              onClick={() => {
                console.log('Image area clicked:', image.id);
                onImageClick?.(image);
              }}
            >
              <img
                src={image.url}
                alt={`Generated ${image.id}`}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                onError={(e) => {
                  // Handle image load errors
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12" font-family="system-us"%3EImage Failed to Load%3C/text%3E%3C/svg%3E';
                }}
              />
              {/* Click hint overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="text-sm">Click for options</div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-3">
                {image.width}x{image.height} ({image.format})
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image);
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
