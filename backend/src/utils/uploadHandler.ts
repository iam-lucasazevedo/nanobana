import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Configure multer for file uploads
 */

// Use memory storage for temporary file handling
const storage = multer.memoryStorage();

// File filter to only accept images
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allow only JPEG and PNG files
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only JPEG and PNG allowed.`
      )
    );
  }
};

// Create multer instance with configuration
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files
  }
});

/**
 * Get uploaded file information
 */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Convert uploaded file to base64
 */
export function fileToBase64(file: Express.Multer.File | UploadedFile): string {
  if (!file.buffer) {
    throw new Error('File buffer is missing');
  }
  return file.buffer.toString('base64');
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Get MIME type from file
 */
export function getMimeType(file: Express.Multer.File | UploadedFile): string {
  return file.mimetype;
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const uniqueName = `${uuidv4()}${ext}`;
  return uniqueName;
}

/**
 * Validate file before processing
 */
export function validateUploadedFile(
  file: Express.Multer.File | UploadedFile
): { valid: boolean; error?: string } {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`
    };
  }

  // Check MIME type
  if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
    return {
      valid: false,
      error: `Invalid file type: ${file.mimetype}. Only JPEG and PNG allowed.`
    };
  }

  return { valid: true };
}
