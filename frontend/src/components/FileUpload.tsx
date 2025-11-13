import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  disabled = false,
  maxFiles = 10
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Filter to only image files
    const imageFiles = files.filter(
      (file) => file.type === 'image/jpeg' || file.type === 'image/png'
    );

    if (imageFiles.length !== files.length) {
      const skipped = files.length - imageFiles.length;
      alert(
        `${skipped} file(s) skipped. Only JPEG and PNG files are supported.`
      );
    }

    // Check file count limit
    if (imageFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed. Selected ${imageFiles.length}.`);
      return;
    }

    onFilesSelected(imageFiles);
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        w-full border-2 border-dashed rounded-lg p-8 text-center
        transition-colors cursor-pointer
        ${disabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : ''}
        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
        ${!disabled && !dragActive ? 'hover:border-blue-400 hover:bg-blue-50' : ''}
      `}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={32} cy={20} r={4} strokeWidth={2} />
        <path
          d="M4 40l12-12 8 8 20-20"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <p className="mt-4 text-lg font-medium text-gray-700">
        {disabled ? 'Upload disabled' : 'Drop images here or click to upload'}
      </p>
      <p className="text-sm text-gray-500">
        JPEG or PNG up to 10MB each. Maximum {maxFiles} images.
      </p>
    </div>
  );
};
