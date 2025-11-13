import { httpClient } from './httpClient.js';
import { GeneratedImage } from '../types/models.js';

export interface TaskPayload {
  taskId: string;
  prompt: string;
  size?: string;
  style?: string;
  aspectRatio?: string;
}

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
  }): Promise<TaskPayload> {
    try {
      // Map size to image_size (aspect ratio format)
      const imageSize = this.mapSizeToImageSize(payload.size);

      // Create task via Nano Banana API
      const response = await httpClient.createGenerationTask({
        model: 'google/nano-banana',
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
  }): Promise<TaskPayload> {
    try {
      const imageSize = this.mapSizeToImageSize(payload.aspectRatio);

      const response = await httpClient.createEditTask({
        model: 'google/nano-banana-edit',
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
  }): Promise<TaskPayload> {
    try {
      const imageSize = this.mapSizeToImageSize(payload.aspectRatio);

      // Convert buffer to base64
      const base64Image = payload.imageBuffer.toString('base64');
      const imageData = `data:image/png;base64,${base64Image}`;

      const response = await httpClient.createEditTask({
        model: 'google/nano-banana-edit',
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
  } {
    return {
      sizes: ['512x512', '768x768', '1024x768', '1024x1024'],
      styles: ['default', 'modern', 'minimalist', 'artistic', 'photorealistic'],
      aspectRatios: ['1:1', '4:3', '16:9', '9:16']
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
