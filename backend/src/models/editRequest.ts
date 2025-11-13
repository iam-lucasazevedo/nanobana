import { EditRequest } from '../types/models.js';

// Allowed styles for edit requests
export const ALLOWED_STYLES = [
  'default',
  'modern',
  'minimalist',
  'artistic',
  'photorealistic'
];

// Image format validation
export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
const MAX_IMAGES = 10;
const MIN_IMAGES = 1;

export interface EditRequestValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate edit request parameters
 */
export function validateEditRequest(data: {
  editPrompt?: string;
  style?: string;
  imageCount?: number;
}): EditRequestValidation {
  const errors: string[] = [];

  // Validate edit prompt
  if (!data.editPrompt || typeof data.editPrompt !== 'string') {
    errors.push('Edit prompt is required');
  } else if (data.editPrompt.trim().length === 0) {
    errors.push('Edit prompt cannot be empty');
  } else if (data.editPrompt.length > 1000) {
    errors.push('Edit prompt must be less than 1000 characters');
  }

  // Validate style
  if (data.style && !ALLOWED_STYLES.includes(data.style)) {
    errors.push(`Style must be one of: ${ALLOWED_STYLES.join(', ')}`);
  }

  // Validate image count
  if (!data.imageCount || typeof data.imageCount !== 'number') {
    errors.push('Image count is required');
  } else if (data.imageCount < MIN_IMAGES) {
    errors.push(`At least ${MIN_IMAGES} image is required`);
  } else if (data.imageCount > MAX_IMAGES) {
    errors.push(`Maximum ${MAX_IMAGES} images allowed`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: {
    mimetype: string;
    size: number;
    originalname: string;
  }
): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_IMAGE_FORMATS.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File format not supported. Allowed: JPEG, PNG. Got: ${file.mimetype}`
    };
  }

  // Check file extension
  const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension not supported. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_IMAGE_SIZE / (1024 * 1024)}MB limit`
    };
  }

  return { valid: true };
}

/**
 * Create an edit request record for database
 */
export function createEditRequest(
  id: string,
  sessionId: string,
  data: {
    editPrompt: string;
    style?: string;
  }
): EditRequest {
  const style = (data.style || 'default') as 'default' | 'modern' | 'minimalist' | 'artistic' | 'photorealistic';
  return {
    id,
    session_id: sessionId,
    edit_prompt: data.editPrompt,
    style,
    status: 'pending',
    created_at: new Date().toISOString()
  };
}
