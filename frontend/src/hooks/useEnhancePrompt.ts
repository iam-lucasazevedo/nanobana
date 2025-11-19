/**
 * Hook for managing prompt enhancement state and API calls
 * Handles loading, error states, and timeout clearing
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

interface UseEnhancePromptReturn {
  enhancedPrompt: string | null;
  isLoading: boolean;
  error: string | null;
  enhance: (prompt: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for enhancing prompts via the backend API
 * Manages loading/error state and auto-clears errors after 5 seconds
 * @returns Object with enhancement state and methods
 */
export function useEnhancePrompt(): UseEnhancePromptReturn {
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeoutId, setErrorTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clear the error message and cancel auto-clear timeout if active
   */
  const clearError = useCallback(() => {
    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId);
      setErrorTimeoutId(null);
    }
    setError(null);
  }, [errorTimeoutId]);

  /**
   * Enhance the given prompt using the backend API
   * @param prompt The user's original prompt to enhance
   */
  const enhance = useCallback(
    async (prompt: string) => {
      try {
        // Clear any previous error
        clearError();

        // Clear previous enhanced prompt
        setEnhancedPrompt(null);

        // Prevent empty/whitespace prompts
        if (!prompt || prompt.trim().length === 0) {
          setError('Please enter a prompt to enhance');
          return;
        }

        // Start loading
        setIsLoading(true);

        // Call the API
        const result = await apiClient.enhancePrompt(prompt);

        // Set the enhanced prompt
        setEnhancedPrompt(result);
        setError(null);
      } catch (err) {
        // Handle errors
        const errorMessage = err instanceof Error ? err.message : 'Enhancement failed. Please try again.';
        setError(errorMessage);
        setEnhancedPrompt(null);

        // Auto-clear error after 5 seconds
        const timeoutId = setTimeout(() => {
          setError(null);
          setErrorTimeoutId(null);
        }, 5000);

        setErrorTimeoutId(timeoutId);
      } finally {
        // Stop loading
        setIsLoading(false);
      }
    },
    [clearError]
  );

  return {
    enhancedPrompt,
    isLoading,
    error,
    enhance,
    clearError
  };
}
