/**
 * File validation utilities for image uploads
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

/**
 * Validate a single file
 */
export function validateFile(
  file: {
    mimetype: string;
    size: number;
    originalname: string;
  },
  options?: FileValidationOptions
): FileValidationResult {
  const maxSize = options?.maxSize || MAX_FILE_SIZE;
  const mimeTypes = options?.allowedMimeTypes || ALLOWED_MIME_TYPES;
  const extensions = options?.allowedExtensions || ALLOWED_EXTENSIONS;

  // Check MIME type
  if (!mimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.mimetype}. Allowed types: ${mimeTypes.join(', ')}`
    };
  }

  // Check file extension
  const fileExt = '.' + (file.originalname.split('.').pop()?.toLowerCase() || '');
  if (!extensions.includes(fileExt)) {
    return {
      valid: false,
      error: `Invalid file extension: ${fileExt}. Allowed: ${extensions.join(', ')}`
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large: ${fileSizeMB}MB exceeds limit of ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: {
    mimetype: string;
    size: number;
    originalname: string;
  }[],
  maxCount: number = 10,
  options?: FileValidationOptions
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check file count
  if (files.length === 0) {
    errors.push('At least one file is required');
    return { valid: false, errors };
  }

  if (files.length > maxCount) {
    errors.push(`Maximum ${maxCount} files allowed. Got ${files.length}`);
  }

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const result = validateFile(files[i], options);
    if (!result.valid) {
      errors.push(`File ${i + 1} (${files[i].originalname}): ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
