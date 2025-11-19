import React, { useState } from 'react';

export interface ImageData {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

interface ImagePreviewProps {
  image: ImageData;
  prompt?: string;
  onDownload?: (image: ImageData) => void;
  onEdit?: (image: ImageData) => void;
}

export function ImagePreview({
  image,
  prompt,
  onDownload,
  onEdit
}: ImagePreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="group relative rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
      <div
        className="aspect-square w-full relative cursor-zoom-in overflow-hidden bg-muted/30"
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={image.url}
          alt={prompt || 'Generated image'}
          className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100 scale-100 group-hover:scale-105' : 'opacity-0 scale-95'
            }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(image);
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white transition-transform hover:scale-110"
              title="Edit Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}

          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(image);
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white transition-transform hover:scale-110"
              title="Download"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {prompt && (
        <div className="p-4 border-t border-white/5 bg-white/5">
          <p className="text-sm text-muted-foreground line-clamp-2 font-medium">
            {prompt}
          </p>
        </div>
      )}
    </div>
  );
}
