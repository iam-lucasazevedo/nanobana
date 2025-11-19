/**
 * Enhance Prompt Button Component
 * UI component for triggering prompt enhancement with loading and error states
 */

import React, { useState, useEffect } from 'react';
import { useEnhancePrompt } from '../hooks/useEnhancePrompt';

interface EnhancePromptButtonProps {
  /**
   * The current prompt text to enhance
   */
  prompt: string;

  /**
   * Callback when enhancement succeeds
   * Receives the enhanced prompt text
   */
  onPromptEnhanced: (enhancedPrompt: string) => void;

  /**
   * Callback when enhancement fails
   * Receives the error message
   */
  onError?: (error: string) => void;

  /**
   * Optional CSS class for button styling
   */
  className?: string;

  /**
   * Optional custom button text
   */
  buttonText?: string;

  /**
   * Optional loading text
   */
  loadingText?: string;
}

/**
 * Button component for enhancing user prompts
 * Shows loading state during enhancement, displays errors, and calls callback on success
 */
export function EnhancePromptButton({
  prompt,
  onPromptEnhanced,
  onError,
  className = '',
  buttonText = 'Enhance',
  loadingText = 'Enhancing...'
}: EnhancePromptButtonProps) {
  const { enhancedPrompt, isLoading, error, enhance, clearError } = useEnhancePrompt();
  const [showError, setShowError] = useState(false);

  // Handle successful enhancement
  useEffect(() => {
    if (enhancedPrompt) {
      onPromptEnhanced(enhancedPrompt);
    }
  }, [enhancedPrompt, onPromptEnhanced]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setShowError(true);
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  /**
   * Handle button click - trigger enhancement
   */
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await enhance(prompt);
  };

  /**
   * Handle dismiss error message
   */
  const handleDismissError = () => {
    setShowError(false);
    clearError();
  };

  // Button is disabled if prompt is empty or enhancement is in progress
  const isDisabled = !prompt.trim() || isLoading;

  return (
    <div className="relative inline-block">
      {/* Main button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
          ${isDisabled
            ? 'bg-muted text-muted-foreground border-transparent cursor-not-allowed'
            : 'bg-secondary/50 text-secondary-foreground border-white/10 hover:bg-secondary hover:border-white/20'
          }
          ${className}
        `}
        title="Enhance prompt with AI"
        aria-busy={isLoading}
        aria-label={isLoading ? loadingText : buttonText}
      >
        <span className="flex items-center gap-2">
          {isLoading ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" />
            </svg>
          )}
          {isLoading ? loadingText : buttonText}
        </span>
      </button>

      {/* Error message */}
      {showError && error && (
        <div
          className="
            absolute top-full left-0 mt-2 z-50 w-64
            bg-red-50 border border-red-200 rounded-lg p-3
            flex items-start gap-3 shadow-lg
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          role="alert"
        >
          {/* Error icon */}
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>

          {/* Error text */}
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismissError}
            className="
              flex-shrink-0 text-red-600 hover:text-red-700
              transition-colors duration-150
              p-1
            "
            aria-label="Dismiss error message"
          >
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default EnhancePromptButton;
