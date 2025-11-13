import { GenerationRequest } from '../types/models.js';

// Allowed values for generation requests
export const ALLOWED_SIZES = [
  '512x512',
  '768x768',
  '1024x768',
  '1024x1024'
] as const;

export const ALLOWED_STYLES = [
  'default',
  'modern',
  'minimalist',
  'artistic',
  'photorealistic'
] as const;

export const ALLOWED_ASPECT_RATIOS = [
  '1:1',
  '4:3',
  '16:9',
  '9:16'
] as const;

/**
 * Validate a generation request
 */
export function validateGenerationRequest(request: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate prompt
  if (!request.prompt || typeof request.prompt !== 'string') {
    errors.push('Prompt is required and must be a string');
  } else if (request.prompt.trim().length === 0) {
    errors.push('Prompt cannot be empty');
  } else if (request.prompt.length > 1000) {
    errors.push('Prompt must be less than 1000 characters');
  }

  // Validate size
  if (request.size && !ALLOWED_SIZES.includes(request.size)) {
    errors.push(
      `Size must be one of: ${ALLOWED_SIZES.join(', ')}`
    );
  }

  // Validate style
  if (request.style && !ALLOWED_STYLES.includes(request.style)) {
    errors.push(
      `Style must be one of: ${ALLOWED_STYLES.join(', ')}`
    );
  }

  // Validate aspect ratio
  if (
    request.aspectRatio &&
    !ALLOWED_ASPECT_RATIOS.includes(request.aspectRatio)
  ) {
    errors.push(
      `Aspect ratio must be one of: ${ALLOWED_ASPECT_RATIOS.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a generation request object with defaults
 */
export function createGenerationRequest(
  id: string,
  sessionId: string,
  payload: any
): GenerationRequest {
  return {
    id,
    session_id: sessionId,
    prompt: payload.prompt.trim(),
    size: (payload.size || '1024x768') as any,
    style: (payload.style || 'default') as any,
    aspect_ratio: (payload.aspectRatio || '16:9') as any,
    status: 'pending',
    created_at: new Date().toISOString()
  };
}
