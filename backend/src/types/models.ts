/**
 * Data Models for Nano Banana Image Generation App
 */

export interface UserSession {
  session_id: string;
  created_at: string; // ISO8601
  last_accessed_at: string; // ISO8601
}

export interface GenerationRequest {
  id: string; // UUID
  session_id: string;
  prompt: string;
  size: 'corei3' | '512x512' | '768x768' | '1024x768' | '1024x1024';
  style: 'default' | 'modern' | 'minimalist' | 'artistic' | 'photorealistic';
  aspect_ratio: '1:1' | '4:3' | '16:9' | '9:16';
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string; // ISO8601
}

export interface EditRequest {
  id: string; // UUID
  session_id: string;
  edit_prompt: string;
  style: 'default' | 'modern' | 'minimalist' | 'artistic' | 'photorealistic';
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string; // ISO8601
}

export interface UserPreferences {
  session_id: string;
  preferred_size: string;
  preferred_style: string;
  preferred_aspect_ratio: string;
  last_active_mode: 'generation' | 'edit';
}

export interface GeneratedImage {
  id: string; // UUID
  url: string;
  width: number;
  height: number;
  format: 'jpeg' | 'png';
  created_at: string; // ISO8601
  associated_request_id: string;
  request_type: 'generation' | 'edit';
  metadata?: Record<string, any>;
}

// API Request/Response Types

export interface GenerateImageRequest {
  prompt: string;
  size?: string;
  style?: string;
  aspectRatio?: string;
}

export interface GenerateImageResponse {
  requestId: string;
  status: 'completed' | 'pending' | 'failed';
  images?: GeneratedImage[];
  error?: string;
  details?: string;
  createdAt: string;
}

export interface EditImageRequest {
  editPrompt: string;
  style?: string;
  aspectRatio?: string;
}

export interface EditImageResponse {
  requestId: string;
  status: 'completed' | 'pending' | 'failed';
  variants?: GeneratedImage[];
  error?: string;
  details?: string;
  createdAt: string;
}

export interface SessionResponse {
  sessionId: string;
  recentPrompts: string[];
  recentEditPrompts: string[];
  preferredSize: string;
  preferredStyle: string;
  preferredAspectRatio: string;
  lastActiveMode: 'generation' | 'edit';
  generationHistory: GenerationRequest[];
  editHistory: EditRequest[];
  createdAt: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
