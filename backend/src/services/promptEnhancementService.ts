/**
 * Prompt Enhancement Service
 * Handles integration with n8n webhook for AI-powered prompt improvement
 */

import axios, { AxiosError } from 'axios';
import { ErrorMessages, getErrorMessage } from '../utils/errorMessages';

/**
 * Service for enhancing user prompts using n8n AI agent
 */
export class PromptEnhancementService {
  private webhookUrl?: string;
  private timeoutMs: number;

  constructor(
    webhookUrl?: string,
    timeoutMs?: number
  ) {
    // Store provided values or will load from env when needed
    this.webhookUrl = webhookUrl;
    this.timeoutMs = timeoutMs || parseInt(process.env.N8N_ENHANCEMENT_TIMEOUT_MS || '30000', 10);
  }

  /**
   * Get the webhook URL, loading from env if not provided in constructor
   */
  private getWebhookUrl(): string {
    if (this.webhookUrl) {
      return this.webhookUrl;
    }

    const envUrl = process.env.N8N_ENHANCEMENT_WEBHOOK_URL;
    if (!envUrl) {
      throw new Error('N8N_ENHANCEMENT_WEBHOOK_URL environment variable is required');
    }

    this.webhookUrl = envUrl;
    return this.webhookUrl;
  }

  /**
   * Enhance a prompt using the n8n AI agent
   * @param originalPrompt - The user's original prompt to enhance
   * @returns The enhanced prompt as plain text
   * @throws Error with appropriate status code and message
   */
  async enhancePrompt(originalPrompt: string): Promise<string> {
    // Validate prompt
    this.validatePrompt(originalPrompt);

    try {
      // Call n8n webhook
      const response = await axios.post(
        this.getWebhookUrl(),
        { prompt: originalPrompt },
        {
          timeout: this.timeoutMs,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract enhanced prompt from response
      // n8n returns plain text in the response body
      const enhancedPrompt = this.extractEnhancedPrompt(response.data);

      return enhancedPrompt;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate the prompt before sending to n8n
   * @param prompt - The prompt to validate
   * @throws Error if validation fails
   */
  private validatePrompt(prompt: string): void {
    // Check for empty or whitespace-only prompt
    if (!prompt || prompt.trim().length === 0) {
      const error = getErrorMessage('ENHANCEMENT_PROMPT_EMPTY');
      const err = new Error(error.message) as any;
      err.statusCode = error.statusCode;
      err.code = error.code;
      throw err;
    }

    // Check for prompt length limit (10,000 characters)
    if (prompt.length > 10000) {
      const error = getErrorMessage('ENHANCEMENT_PROMPT_TOO_LONG');
      const err = new Error(error.message) as any;
      err.statusCode = error.statusCode;
      err.code = error.code;
      throw err;
    }
  }

  /**
   * Extract the enhanced prompt from n8n response
   * n8n returns the enhanced prompt as plain text in the response body
   * @param responseData - The response data from n8n
   * @returns The enhanced prompt string
   */
  private extractEnhancedPrompt(responseData: any): string {
    // If response is a string, use it directly
    if (typeof responseData === 'string') {
      return responseData;
    }

    // If response is an object, try to find the enhanced prompt
    if (typeof responseData === 'object') {
      // Try common field names
      if (responseData.prompt) return responseData.prompt;
      if (responseData.enhanced_prompt) return responseData.enhanced_prompt;
      if (responseData.enhancedPrompt) return responseData.enhancedPrompt;
      if (responseData.result) return responseData.result;
      if (responseData.data) return responseData.data;
      if (responseData.text) return responseData.text;
    }

    // Fallback: convert to string
    return String(responseData);
  }

  /**
   * Handle errors from the n8n webhook call
   * @param error - The error that occurred
   * @returns Never (always throws)
   * @throws Enhanced error with appropriate status code
   */
  private handleError(error: any): never {
    // Handle axios timeout errors
    if (error.code === 'ECONNABORTED') {
      const timeoutError = getErrorMessage('ENHANCEMENT_TIMEOUT');
      const err = new Error(timeoutError.message) as any;
      err.statusCode = timeoutError.statusCode;
      err.code = timeoutError.code;
      throw err;
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('EAI_AGAIN')) {
      const networkError = getErrorMessage('ENHANCEMENT_NETWORK_ERROR');
      const err = new Error(networkError.message) as any;
      err.statusCode = networkError.statusCode;
      err.code = networkError.code;
      throw err;
    }

    // Handle HTTP errors from n8n
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;

      // n8n returns plain text error message on failure
      const errorMessage = typeof responseData === 'string'
        ? responseData
        : responseData?.message || responseData?.error || String(responseData);

      const enhancementError = new Error(errorMessage) as any;
      enhancementError.statusCode = status;
      enhancementError.code = 'ENHANCEMENT_ERROR';

      // Map specific HTTP codes
      if (status === 503) {
        const serviceError = getErrorMessage('ENHANCEMENT_SERVICE_UNAVAILABLE');
        enhancementError.statusCode = serviceError.statusCode;
        enhancementError.code = serviceError.code;
      } else if (status === 500) {
        // Keep the error message from n8n, use 500 status
        enhancementError.statusCode = 500;
        enhancementError.code = 'ENHANCEMENT_ERROR';
      }

      throw enhancementError;
    }

    // Handle all other errors
    const genericError = getErrorMessage('ENHANCEMENT_ERROR');
    const err = new Error(
      error.message || genericError.message
    ) as any;
    err.statusCode = genericError.statusCode;
    err.code = genericError.code;
    throw err;
  }
}

// Export singleton instance
export const promptEnhancementService = new PromptEnhancementService();
