import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '../services/apiClient.js';

export interface GenerationOptions {
  prompt: string;
  model?: string;
  size: string;
  style: string;
  aspectRatio: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

export interface UseGenerationResult {
  images: GeneratedImage[];
  loading: boolean;
  error: string | null;
  options: GenerationOptions | null;
  taskState?: string;
  generate: (options: GenerationOptions) => Promise<void>;
  clearImages: () => void;
  clearError: () => void;
}

/**
 * Custom hook to manage image generation with async polling
 */
export function useGeneration(): UseGenerationResult {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<GenerationOptions | null>(null);
  const [taskState, setTaskState] = useState<string>('');

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taskIdRef = useRef<string | null>(null);

  // Cleanup function for polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  // Poll for task status
  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      const response = await apiClient.getGenerationStatus(taskId);

      if (response.status === 'completed' && response.images) {
        // Task complete
        setImages(response.images);
        setLoading(false);
        setTaskState('');
        stopPolling();
      } else if (response.status === 'failed') {
        // Task failed
        setError(response.details || response.error || 'Generation failed');
        setLoading(false);
        setTaskState('');
        stopPolling();
      } else {
        // Still processing
        setTaskState(response.taskState || 'generating');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check generation status';
      setError(errorMsg);
      setLoading(false);
      stopPolling();
    }
  }, [stopPolling]);

  // Start polling for task status
  const startPolling = useCallback((taskId: string) => {
    taskIdRef.current = taskId;

    // Poll every 2-3 seconds
    const pollInterval = 2500;
    const maxWaitTime = 120000; // 2 minutes timeout

    // Poll immediately, then every interval
    pollTaskStatus(taskId);

    pollIntervalRef.current = setInterval(() => {
      pollTaskStatus(taskId);
    }, pollInterval);

    // Set timeout to stop polling after max wait
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setError('Generation timeout. Please try again.');
      setLoading(false);
    }, maxWaitTime);
  }, [pollTaskStatus, stopPolling]);

  const generate = useCallback(async (opts: GenerationOptions) => {
    setLoading(true);
    setError(null);
    setImages([]);
    setOptions(opts);
    setTaskState('queuing');

    try {
      // Step 1: Create generation task
      const createResponse = await apiClient.generateImages({
        prompt: opts.prompt,
        model: opts.model,
        size: opts.size,
        style: opts.style,
        aspectRatio: opts.aspectRatio
      });

      if (createResponse.error) {
        setError(createResponse.details || createResponse.error);
        setLoading(false);
        return;
      }

      // Step 2: Get taskId and start polling
      const taskId = (createResponse as any).taskId;
      if (!taskId) {
        setError('Failed to create generation task');
        setLoading(false);
        return;
      }

      // Start polling for results
      startPolling(taskId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate images';
      setError(errorMsg);
      setLoading(false);
    }
  }, [startPolling]);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    images,
    loading,
    error,
    options,
    taskState,
    generate,
    clearImages,
    clearError
  };
}
