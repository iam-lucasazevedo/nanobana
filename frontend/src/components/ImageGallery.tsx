import React, { useState } from 'react';

export interface GalleryImage {
  id: string;
  url: string;
  timestamp: string;
  type: 'generation' | 'edit';
  prompt?: string;
  metadata?: {
    size?: string;
    style?: string;
  };
}

interface ImageGalleryProps {
  images: GalleryImage[];
  title?: string;
  onImageSelect?: (image: GalleryImage) => void;
  onImageUse?: (image: GalleryImage) => void;
  maxColumns?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  title = 'Session Gallery',
  onImageSelect,
  onImageUse,
  maxColumns = 4
}) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  if (images.length === 0) {
    return null;
  }

  const selectedImage = images.find((img) => img.id === selectedImageId);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>

        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-${maxColumns} gap-4`}>
          {images.map((image) => (
            <div
              key={image.id}
              onClick={() => {
                setSelectedImageId(image.id);
                onImageSelect?.(image);
              }}
              className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                selectedImageId === image.id
                  ? 'ring-2 ring-blue-500'
                  : 'hover:ring-2 hover:ring-blue-300'
              }`}
            >
              {/* Image */}
              <img
                src={image.url}
                alt={`Gallery image ${image.id}`}
                className="w-full h-40 object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-end justify-between p-3">
                <span className={`text-sm px-2 py-1 rounded text-white font-medium ${
                  image.type === 'generation'
                    ? 'bg-blue-500'
                    : 'bg-purple-500'
                }`}>
                  {image.type === 'generation' ? '✨ Generated' : '🖼️ Edited'}
                </span>

                {onImageUse && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageUse(image);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Use
                  </button>
                )}
              </div>

              {/* Timestamp */}
              <div className="absolute top-2 left-2 bg-black/40 text-white px-2 py-1 rounded text-xs">
                {new Date(image.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Image Details */}
        {selectedImage && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Image Details</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Type:</span> {
                  selectedImage.type === 'generation' ? 'Generated' : 'Edited'
                }
              </p>
              {selectedImage.prompt && (
                <p>
                  <span className="font-medium">Prompt:</span> {selectedImage.prompt}
                </p>
              )}
              {selectedImage.metadata?.size && (
                <p>
                  <span className="font-medium">Size:</span> {selectedImage.metadata.size}
                </p>
              )}
              {selectedImage.metadata?.style && (
                <p>
                  <span className="font-medium">Style:</span> {selectedImage.metadata.style}
                </p>
              )}
              <p>
                <span className="font-medium">Created:</span> {
                  new Date(selectedImage.timestamp).toLocaleString()
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
