/**
 * Error Messages and User-Friendly Descriptions
 * Provides comprehensive error handling with helpful messages
 */

export interface ErrorInfo {
  code: string;
  message: string;
  details: string;
  statusCode: number;
  suggestedAction?: string;
}

export const ErrorMessages = {
  // Session Errors
  SESSION_MISSING: {
    code: 'SESSION_MISSING',
    message: 'Session not found',
    details: 'Your session has expired or is invalid. Please refresh the page to create a new session.',
    statusCode: 404,
    suggestedAction: 'Refresh the page'
  } as ErrorInfo,

  SESSION_HEADER_MISSING: {
    code: 'SESSION_HEADER_MISSING',
    message: 'Missing session header',
    details: 'The X-Session-ID header is required for this request.',
    statusCode: 400,
    suggestedAction: 'Ensure your session ID is properly configured'
  } as ErrorInfo,

  // API Key Errors
  API_KEY_MISSING: {
    code: 'API_KEY_MISSING',
    message: 'API key not configured',
    details: 'The Nano Banana API key is missing. Please configure it in your environment variables.',
    statusCode: 500,
    suggestedAction: 'Contact support to configure API access'
  } as ErrorInfo,

  API_KEY_INVALID: {
    code: 'API_KEY_INVALID',
    message: 'Invalid API key',
    details: 'The API key is invalid or expired. Please check your configuration.',
    statusCode: 401,
    suggestedAction: 'Update your API key configuration'
  } as ErrorInfo,

  // File Upload Errors
  FILE_MISSING: {
    code: 'FILE_MISSING',
    message: 'No files uploaded',
    details: 'Please select at least one image to upload.',
    statusCode: 400,
    suggestedAction: 'Upload at least one image'
  } as ErrorInfo,

  FILE_COUNT_EXCEEDED: {
    code: 'FILE_COUNT_EXCEEDED',
    message: 'Too many files',
    details: 'You can upload a maximum of 10 images at a time.',
    statusCode: 400,
    suggestedAction: 'Remove some images and try again'
  } as ErrorInfo,

  FILE_SIZE_EXCEEDED: {
    code: 'FILE_SIZE_EXCEEDED',
    message: 'File too large',
    details: 'Each image must be smaller than 10MB. Please compress your images.',
    statusCode: 400,
    suggestedAction: 'Reduce image file size and try again'
  } as ErrorInfo,

  FILE_INVALID_FORMAT: {
    code: 'FILE_INVALID_FORMAT',
    message: 'Invalid file format',
    details: 'Only JPEG and PNG images are supported. Please check your file format.',
    statusCode: 400,
    suggestedAction: 'Convert images to JPEG or PNG format'
  } as ErrorInfo,

  // Prompt Errors
  PROMPT_MISSING: {
    code: 'PROMPT_MISSING',
    message: 'Prompt is required',
    details: 'Please enter a description for what you want to generate.',
    statusCode: 400,
    suggestedAction: 'Write a prompt and try again'
  } as ErrorInfo,

  PROMPT_TOO_LONG: {
    code: 'PROMPT_TOO_LONG',
    message: 'Prompt too long',
    details: 'Your prompt is too long. Please keep it under 1000 characters.',
    statusCode: 400,
    suggestedAction: 'Shorten your prompt and try again'
  } as ErrorInfo,

  EDIT_PROMPT_MISSING: {
    code: 'EDIT_PROMPT_MISSING',
    message: 'Edit instructions required',
    details: 'Please describe what you want to change in your images.',
    statusCode: 400,
    suggestedAction: 'Add edit instructions and try again'
  } as ErrorInfo,

  EDIT_PROMPT_TOO_LONG: {
    code: 'EDIT_PROMPT_TOO_LONG',
    message: 'Edit instructions too long',
    details: 'Your edit instructions are too long. Please keep it under 1000 characters.',
    statusCode: 400,
    suggestedAction: 'Shorten your instructions and try again'
  } as ErrorInfo,

  // API Call Errors
  API_TIMEOUT: {
    code: 'API_TIMEOUT',
    message: 'Request timeout',
    details: 'The request took too long to complete. Please try again.',
    statusCode: 504,
    suggestedAction: 'Try again in a moment'
  } as ErrorInfo,

  API_RATE_LIMIT: {
    code: 'API_RATE_LIMIT',
    message: 'Rate limit exceeded',
    details: 'You\'ve made too many requests. Please wait a moment and try again.',
    statusCode: 429,
    suggestedAction: 'Wait a few minutes before trying again'
  } as ErrorInfo,

  API_SERVICE_ERROR: {
    code: 'API_SERVICE_ERROR',
    message: 'Service error',
    details: 'The image service is currently unavailable. Please try again later.',
    statusCode: 503,
    suggestedAction: 'Try again in a few minutes'
  } as ErrorInfo,

  API_UNKNOWN_ERROR: {
    code: 'API_UNKNOWN_ERROR',
    message: 'Generation failed',
    details: 'The image generation failed unexpectedly. Please try again.',
    statusCode: 500,
    suggestedAction: 'Try again or contact support'
  } as ErrorInfo,

  // Validation Errors
  INVALID_SIZE: {
    code: 'INVALID_SIZE',
    message: 'Invalid image size',
    details: 'The selected image size is not supported. Please choose from available options.',
    statusCode: 400,
    suggestedAction: 'Select a different image size'
  } as ErrorInfo,

  INVALID_STYLE: {
    code: 'INVALID_STYLE',
    message: 'Invalid style',
    details: 'The selected style is not supported. Please choose from available options.',
    statusCode: 400,
    suggestedAction: 'Select a different style'
  } as ErrorInfo,

  INVALID_ASPECT_RATIO: {
    code: 'INVALID_ASPECT_RATIO',
    message: 'Invalid aspect ratio',
    details: 'The selected aspect ratio is not supported. Please choose from available options.',
    statusCode: 400,
    suggestedAction: 'Select a different aspect ratio'
  } as ErrorInfo,

  // Database Errors
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database error',
    details: 'There was a problem saving your data. Please try again.',
    statusCode: 500,
    suggestedAction: 'Try again or contact support'
  } as ErrorInfo,

  // Supabase/Storage Errors
  STORAGE_UPLOAD_FAILED: {
    code: 'STORAGE_UPLOAD_FAILED',
    message: 'Upload failed',
    details: 'Failed to upload images. Please check your file size and try again.',
    statusCode: 500,
    suggestedAction: 'Check file size and try again'
  } as ErrorInfo,

  STORAGE_BUCKET_NOT_FOUND: {
    code: 'STORAGE_BUCKET_NOT_FOUND',
    message: 'Storage configuration error',
    details: 'The image storage is not properly configured. Please contact support.',
    statusCode: 500,
    suggestedAction: 'Contact support'
  } as ErrorInfo,

  // Generic Errors
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    details: 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
    suggestedAction: 'Try again or contact support if the problem persists'
  } as ErrorInfo,

  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    message: 'Invalid request',
    details: 'The request contains invalid data. Please check your input.',
    statusCode: 400,
    suggestedAction: 'Review your request and try again'
  } as ErrorInfo
};

/**
 * Map error type to user-friendly error message
 */
export function getErrorMessage(
  errorType: keyof typeof ErrorMessages,
  customDetails?: string
): ErrorInfo {
  const baseError = ErrorMessages[errorType] || ErrorMessages.INTERNAL_SERVER_ERROR;

  if (customDetails) {
    return {
      ...baseError,
      details: customDetails
    };
  }

  return baseError;
}

/**
 * Categorize errors by type for better handling
 */
export function categorizeError(
  error: any
): 'validation' | 'api' | 'storage' | 'database' | 'server' {
  if (error.statusCode === 400) return 'validation';
  if (error.code?.includes('API') || error.code?.includes('api')) return 'api';
  if (error.code?.includes('STORAGE')) return 'storage';
  if (error.code?.includes('DATABASE')) return 'database';
  return 'server';
}
