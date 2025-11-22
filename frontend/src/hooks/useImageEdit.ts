import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '../services/apiClient.js';

export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

export interface UseImageEditResult {
  uploadedFiles: File[];
  editedImages: GeneratedImage[];
  loading: boolean;
  error: string | null;
  taskState?: string;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  editImages: (editPrompt: string, model?: string, style?: string, aspectRatio?: string) => Promise<void>;
  clearImages: () => void;
  clearError: () => void;
}

/**
 * Custom hook to manage image editing with async polling
 */
export function useImageEdit(): UseImageEditResult {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [editedImages, setEditedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const pollTaskStatus = useCallback(
    async (taskId: string) => {
      try {
        const response = await apiClient.getEditStatus(taskId);

        if (response.status === 'completed' && response.variants) {
          // Task complete
          setEditedImages(response.variants);
          setLoading(false);
          setTaskState('');
          stopPolling();
        } else if (response.status === 'failed') {
          // Task failed
          setError(response.details || response.error || 'Edit failed');
          setLoading(false);
          setTaskState('');
          stopPolling();
        } else {
          // Still processing
          setTaskState(response.taskState || 'processing');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to check edit status';
        setError(errorMsg);
        setLoading(false);
        stopPolling();
      }
    },
    [stopPolling]
  );

  // Start polling for task status
  const startPolling = useCallback(
    (taskId: string) => {
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
        setError('Edit timeout. Please try again.');
        setLoading(false);
      }, maxWaitTime);
    },
    [pollTaskStatus, stopPolling]
  );

  const addFiles = useCallback((files: File[]) => {
    setUploadedFiles((prev) => {
      const combined = [...prev, ...files];
      // Enforce max 10 files
      if (combined.length > 10) {
        alert(`Maximum 10 images allowed. Current: ${combined.length}`);
        return prev;
      }
      return combined;
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  const editImages = useCallback(
    async (editPrompt: string, model?: string, style?: string, aspectRatio?: string) => {
      setLoading(true);
      setError(null);
      setEditedImages([]);
      setTaskState('uploading');

      try {
        // Validate files
        if (uploadedFiles.length === 0) {
          setError('No images selected');
          setLoading(false);
          return;
        }

        if (uploadedFiles.length > 10) {
          setError('Maximum 10 images allowed');
          setLoading(false);
          return;
        }

        // Validate edit prompt
        if (!editPrompt || editPrompt.trim().length === 0) {
          setError('Edit prompt is required');
          setLoading(false);
          return;
        }

        if (editPrompt.length > 1000) {
          setError('Edit prompt must be less than 1000 characters');
          setLoading(false);
          return;
        }

        // Create FormData for file upload
        const formData = new FormData();
        uploadedFiles.forEach((file) => {
          formData.append('images', file);
        });
        formData.append('editPrompt', editPrompt);
        console.log('🔍 useImageEdit - Model parameter:', model);
        if (model) formData.append('model', model);
        if (style) formData.append('style', style);
        if (aspectRatio) formData.append('aspectRatio', aspectRatio);

        // Step 1: Upload files and create edit task
        const createResponse = await apiClient.editImages(formData);

        if (createResponse.error) {
          setError(createResponse.details || createResponse.error);
          setLoading(false);
          return;
        }

        // Step 2: Get taskId and start polling
        const taskId = (createResponse as any).taskId;
        if (!taskId) {
          setError('Failed to create edit task');
          setLoading(false);
          return;
        }

        setTaskState('processing');
        // Start polling for results
        startPolling(taskId);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to edit images';
        setError(errorMsg);
        setLoading(false);
      }
    },
    [uploadedFiles, startPolling]
  );

  const clearImages = useCallback(() => {
    setEditedImages([]);
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
    uploadedFiles,
    editedImages,
    loading,
    error,
    taskState,
    addFiles,
    removeFile,
    clearFiles,
    editImages,
    clearImages,
    clearError
  };
}
