import { httpClient } from './httpClient.js';
import { GeneratedImage } from '../types/models.js';

export interface TaskPayload {
  taskId: string;
  prompt: string;
  size?: string;
  style?: string;
  aspectRatio?: string;
  model?: string;
}

// Available models for generation
export const GENERATION_MODELS = {
  'nano-banana': 'google/nano-banana',
  'nano-banana-pro': 'nano-banana-pro'
} as const;

// Available models for editing
export const EDIT_MODELS = {
  'nano-banana-edit': 'google/nano-banana-edit',
  'nano-banana-pro': 'nano-banana-pro'
} as const;

export type GenerationModelKey = keyof typeof GENERATION_MODELS;
export type EditModelKey = keyof typeof EDIT_MODELS;

/**
 * Service for interacting with Nano Banana image generation APIs
 */
export class NanoBananaService {
  /**
   * Create a text-to-image generation task
   * Returns taskId for polling status
   */
  async createGenerationTask(payload: {
    prompt: string;
    size?: string;
    style?: string;
    aspectRatio?: string;
    callBackUrl?: string;
    model?: string;
  }): Promise<TaskPayload> {
    try {
      // Map size to image_size (aspect ratio format)
      const imageSize = this.mapSizeToImageSize(payload.size);

      // Get the model identifier, default to nano-banana-pro
      const modelKey = (payload.model || 'nano-banana-pro') as GenerationModelKey;
      const modelId = GENERATION_MODELS[modelKey] || GENERATION_MODELS['nano-banana-pro'];

      // Create task via Nano Banana API
      const response = await httpClient.createGenerationTask({
        model: modelId,
        callBackUrl: payload.callBackUrl || 'http://localhost:3001/api/callback',
        input: {
          prompt: payload.prompt,
          output_format: 'png',
          image_size: imageSize
        }
      });

      return {
        taskId: response.data.taskId,
        prompt: payload.prompt,
        size: payload.size,
        style: payload.style,
        aspectRatio: payload.aspectRatio
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check task status and get results when ready
   */
  async checkTaskStatus(taskId: string): Promise<{
    state: string;
    images: GeneratedImage[] | null;
    error?: string;
  }> {
    try {
      const response = await httpClient.getTaskStatus(taskId);
      const data = response.data;

      // Check if task is complete
      if (data.state === 'success') {
        // Parse result JSON to extract image URLs
        const resultJson = JSON.parse(data.resultJson);
        const imageUrls = resultJson.resultUrls || [];

        const images = imageUrls.map((url: string) => ({
          id: generateImageId(),
          url: url,
          width: 1024,
          height: 1024,
          format: 'png' as const,
          created_at: new Date().toISOString(),
          associated_request_id: taskId,
          request_type: 'generation' as const,
          metadata: {}
        }));

        return {
          state: 'success',
          images: images
        };
      } else if (data.state === 'fail') {
        return {
          state: 'failed',
          images: null,
          error: data.failMsg || 'Task failed'
        };
      } else {
        // Still processing (waiting, queuing, generating)
        return {
          state: data.state,
          images: null
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create an image editing task
   */
  async createEditTask(payload: {
    imageUrls: string[];
    editPrompt: string;
    style?: string;
    aspectRatio?: string;
    callBackUrl?: string;
    model?: string;
  }): Promise<TaskPayload> {
    try {
      const imageSize = this.mapSizeToImageSize(payload.aspectRatio);

      // Get the model identifier, default to nano-banana-pro for editing
      const modelKey = (payload.model || 'nano-banana-pro') as EditModelKey;
      const modelId = EDIT_MODELS[modelKey] || EDIT_MODELS['nano-banana-pro'];

      const response = await httpClient.createEditTask({
        model: modelId,
        callBackUrl: payload.callBackUrl || 'http://localhost:3001/api/callback',
        input: {
          prompt: payload.editPrompt,
          image_urls: payload.imageUrls,
          output_format: 'png',
          image_size: imageSize
        }
      });

      return {
        taskId: response.data.taskId,
        prompt: payload.editPrompt,
        style: payload.style,
        aspectRatio: payload.aspectRatio
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create an image editing task from image buffer (for refining generated images)
   */
  async createEditTaskFromBuffer(payload: {
    imageBuffer: Buffer;
    editPrompt: string;
    style?: string;
    aspectRatio?: string;
    callBackUrl?: string;
    model?: string;
  }): Promise<TaskPayload> {
    try {
      const imageSize = this.mapSizeToImageSize(payload.aspectRatio);

      // Get the model identifier, default to nano-banana-pro for editing
      const modelKey = (payload.model || 'nano-banana-pro') as EditModelKey;
      const modelId = EDIT_MODELS[modelKey] || EDIT_MODELS['nano-banana-pro'];

      // Convert buffer to base64
      const base64Image = payload.imageBuffer.toString('base64');
      const imageData = `data:image/png;base64,${base64Image}`;

      const response = await httpClient.createEditTask({
        model: modelId,
        callBackUrl: payload.callBackUrl || 'http://localhost:3001/api/callback',
        input: {
          prompt: payload.editPrompt,
          image_urls: [imageData],
          output_format: 'png',
          image_size: imageSize
        }
      });

      return {
        taskId: response.data.taskId,
        prompt: payload.editPrompt,
        style: payload.style,
        aspectRatio: payload.aspectRatio
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get supported generation options
   */
  getGenerationOptions(): {
    sizes: string[];
    styles: string[];
    aspectRatios: string[];
    models: { key: string; label: string; description: string }[];
  } {
    return {
      sizes: ['512x512', '768x768', '1024x768', '1024x1024'],
      styles: ['default', 'modern', 'minimalist', 'artistic', 'photorealistic'],
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'],
      models: [
        { key: 'nano-banana-pro', label: 'Nano Banana 3.0 Pro', description: 'Latest pro model with enhanced quality' },
        { key: 'nano-banana', label: 'Nano Banana', description: 'Standard model' }
      ]
    };
  }

  /**
   * Map internal size format to Nano Banana image_size format
   * Converts from pixel dimensions to aspect ratio
   */
  private mapSizeToImageSize(size?: string): string {
    const sizeMap: { [key: string]: string } = {
      '512x512': '1:1',
      '768x768': '1:1',
      '1024x768': '4:3',
      '1024x1024': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3',
      '1:1': '1:1'
    };

    return sizeMap[size || '1:1'] || '1:1';
  }
}

/**
 * Generate a unique image ID
 */
function generateImageId(): string {
  return `img-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

// Export singleton instance
export const nanoBananaService = new NanoBananaService();
