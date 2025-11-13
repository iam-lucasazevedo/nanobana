import React from 'react';

interface UploadedImagePreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export const UploadedImagePreview: React.FC<UploadedImagePreviewProps> = ({
  files,
  onRemove,
  disabled = false
}) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Uploaded Images ({files.length}/10)
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {files.map((file, index) => {
          const fileUrl = URL.createObjectURL(file);
          const fileName = file.name.length > 15 ? `${file.name.slice(0, 12)}...` : file.name;
          const fileSize = (file.size / 1024 / 1024).toFixed(2);

          return (
            <div
              key={`${index}-${file.name}`}
              className="relative group rounded-lg overflow-hidden bg-gray-100"
            >
              {/* Image */}
              <img
                src={fileUrl}
                alt={`Upload preview ${index + 1}`}
                className="w-full h-32 object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                {/* Remove Button */}
                {!disabled && (
                  <button
                    onClick={() => onRemove(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                    title="Remove image"
                    aria-label={`Remove ${fileName}`}
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* File info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white p-2">
                <p className="text-xs truncate" title={file.name}>
                  {fileName}
                </p>
                <p className="text-xs opacity-75">{fileSize} MB</p>
              </div>
            </div>
          );
        })}
      </div>

      {files.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {files.length} of 10 images ready to edit
        </div>
      )}
    </div>
  );
};
