import axios, { AxiosInstance, AxiosError } from 'axios';
import { getApiKey } from '../utils/apiKey.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    recordId: string;
  };
}

interface RecordInfoResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    model: string;
    state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';
    param: string;
    resultJson: string;
    failCode: string;
    failMsg: string;
    completeTime: number;
    createTime: number;
    updateTime: number;
  };
}

class HttpClient {
  private client: AxiosInstance | null = null;
  private apiKey: string | null = null;
  private readonly BASE_URL = 'https://api.kie.ai/api/v1';

  private ensureClient(): AxiosInstance {
    if (!this.client) {
      this.apiKey = getApiKey();
      this.client = axios.create({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
    }
    return this.client;
  }

  /**
   * Create a task for text-to-image generation
   */
  async createGenerationTask(payload: {
    model: string;
    callBackUrl: string;
    input: {
      prompt: string;
      output_format: string;
      image_size: string;
    };
  }): Promise<CreateTaskResponse> {
    try {
      const client = this.ensureClient();
      const response = await client.post(
        `${this.BASE_URL}/jobs/createTask`,
        payload
      );

      if (response.data.code !== 200) {
        throw new Error(response.data.message || 'Failed to create task');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'Task creation');
    }
  }

  /**
   * Create a task for image editing
   */
  async createEditTask(payload: {
    model: string;
    callBackUrl: string;
    input: {
      prompt: string;
      image_urls: string[];
      output_format: string;
      image_size: string;
    };
  }): Promise<CreateTaskResponse> {
    try {
      const client = this.ensureClient();
      const response = await client.post(
        `${this.BASE_URL}/jobs/createTask`,
        payload
      );

      if (response.data.code !== 200) {
        console.error('Edit task creation error:', response.data);
        throw new Error(response.data.message || 'Failed to create task');
      }

      return response.data;
    } catch (error) {
      console.error('Edit task error details:', error instanceof Error ? error.message : error);
      this.handleError(error, 'Edit task creation');
    }
  }

  /**
   * Poll task status
   */
  async getTaskStatus(taskId: string): Promise<RecordInfoResponse> {
    try {
      const client = this.ensureClient();
      const response = await client.get(
        `${this.BASE_URL}/jobs/recordInfo?taskId=${taskId}`
      );

      if (response.data.code !== 200) {
        throw new Error(response.data.message || 'Failed to get task status');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'Task status check');
    }
  }

  /**
   * Call the Nano Banana text-to-image generation API
   * @deprecated Use createGenerationTask and getTaskStatus instead
   */
  async generateImages(payload: {
    prompt: string;
    size?: string;
    style?: string;
    aspectRatio?: string;
  }): Promise<any> {
    try {
      const client = this.ensureClient();
      const response = await client.post(
        'https://api.kie.ai/nano-banana',
        payload
      );
      return response.data ?? null;
    } catch (error) {
      return this.handleError(error, 'Image generation');
    }
  }

  /**
   * Call the Nano Banana image editing API
   * @deprecated Use createEditTask and getTaskStatus instead
   */
  async editImages(payload: {
    images: any[];
    editPrompt: string;
    style?: string;
    aspectRatio?: string;
  }): Promise<any> {
    try {
      const client = this.ensureClient();
      const response = await client.post(
        'https://api.kie.ai/nano-banana-edit',
        payload
      );
      return response.data ?? null;
    } catch (error) {
      return this.handleError(error, 'Image editing');
    }
  }

  /**
   * Handle HTTP errors and convert to AppError
   */
  private handleError(error: any, operation: string): never {
    console.error(`${operation} - Full error:`, error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      console.error(`${operation} - Response status:`, axiosError.response?.status);
      console.error(`${operation} - Response data:`, axiosError.response?.data);
      console.error(`${operation} - Response headers:`, axiosError.response?.headers);

      if (axiosError.response?.status === 401) {
        throw new AppError(
          401,
          'Unauthorized',
          'Invalid or expired API key'
        );
      }

      if (axiosError.response?.status === 429) {
        throw new AppError(
          429,
          'Too Many Requests',
          'Rate limit exceeded. Please try again later.'
        );
      }

      if (axiosError.response?.status === 400) {
        throw new AppError(
          400,
          'Bad Request',
          axiosError.response?.data?.error || `${operation} request validation failed`
        );
      }

      if (axiosError.code === 'ECONNABORTED') {
        throw new AppError(
          504,
          'Gateway Timeout',
          `${operation} request timed out. Please try again.`
        );
      }

      throw new AppError(
        axiosError.response?.status || 500,
        `${operation} failed`,
        axiosError.message
      );
    }

    throw new AppError(
      500,
      'Internal Server Error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
