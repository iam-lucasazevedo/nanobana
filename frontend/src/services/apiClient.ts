import axios, { AxiosInstance, AxiosError } from 'axios';

// Use VITE_API_URL environment variable if set, otherwise use defaults
let API_BASE_URL = (import.meta as any).env.VITE_API_URL ||
  ((import.meta as any).env?.MODE === 'production' ? '/api' : 'http://localhost:3001/api');

// Ensure API_BASE_URL ends with /api if it doesn't already
if (API_BASE_URL && !API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}
const API_TIMEOUT = 30000;

export interface ApiError {
  error: string;
  details?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private sessionId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Load session ID from localStorage
    this.loadSessionId();

    // Add interceptor to include session ID in all requests
    this.client.interceptors.request.use((config) => {
      if (this.sessionId) {
        config.headers['X-Session-ID'] = this.sessionId;
      }
      return config;
    });

    // Add error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Session expired or invalid
          this.clearSessionId();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize or create a session
   */
  async initSession(): Promise<string> {
    try {
      const response = await this.client.post<any>('/session', {});
      this.sessionId = response.data.sessionId;
      this.saveSessionId();
      return this.sessionId || '';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current session data
   */
  async getSession(): Promise<any> {
    try {
      const response = await this.client.get<any>('/session');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Record<string, any>): Promise<any> {
    try {
      const response = await this.client.post<any>('/session/preferences', preferences);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate images from text prompt
   */
  async generateImages(payload: {
    prompt: string;
    size?: string;
    style?: string;
    aspectRatio?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post<any>('/generate', payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get generation task status by taskId
   */
  async getGenerationStatus(taskId: string): Promise<any> {
    try {
      const response = await this.client.get<any>('/generate/status', {
        params: { taskId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload images and create edit task
   */
  async editImages(formData: FormData): Promise<any> {
    try {
      // Don't set Content-Type for FormData - let axios handle it
      const response = await this.client.post<any>('/edit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refine a generated image with edit prompt
   */
  async refineImage(payload: {
    imageUrl: string;
    editPrompt: string;
    style?: string;
    aspectRatio?: string;
  }): Promise<any> {
    try {
      // Send image URL directly to backend to handle fetching and conversion
      const response = await this.client.post<any>('/refine', {
        imageUrl: payload.imageUrl,
        editPrompt: payload.editPrompt,
        style: payload.style || 'default',
        aspectRatio: payload.aspectRatio || '1:1'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get edit task status by taskId
   */
  async getEditStatus(taskId: string): Promise<any> {
    try {
      const response = await this.client.get<any>('/edit/status', {
        params: { taskId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get refinement task status by taskId
   */
  async getRefinementStatus(taskId: string): Promise<any> {
    try {
      const response = await this.client.get<any>('/refine/status', {
        params: { taskId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get generation options
   */
  async getGenerationOptions(): Promise<any> {
    try {
      const response = await this.client.get<any>('/generate/options');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get edit options
   */
  async getEditOptions(): Promise<any> {
    try {
      const response = await this.client.get<any>('/edit/options');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Download an image from a URL (backend handles CORS)
   */
  async downloadImage(imageUrl: string): Promise<any> {
    try {
      const response = await this.client.post<any>('/download-image', { imageUrl }, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Set session ID (useful for restoring from storage)
   */
  setSessionId(id: string): void {
    this.sessionId = id;
    this.saveSessionId();
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.sessionId = null;
    this.clearSessionId();
  }

  /**
   * Private helper methods
   */

  private loadSessionId(): void {
    const stored = localStorage.getItem('sessionId');
    if (stored) {
      this.sessionId = stored;
    }
  }

  private saveSessionId(): void {
    if (this.sessionId) {
      localStorage.setItem('sessionId', this.sessionId);
    }
  }

  private clearSessionId(): void {
    localStorage.removeItem('sessionId');
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response?.data) {
        return axiosError.response.data;
      }

      return {
        error: axiosError.message,
        details: axiosError.code
      };
    }

    return {
      error: 'Unknown error',
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
