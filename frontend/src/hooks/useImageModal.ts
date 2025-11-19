import { useState } from 'react';
import { ImageData } from '../components/ImagePreview.js';
import { RefinementResult } from '../components/ImageDetailModal.js';

export interface SelectedImage extends ImageData {
  createdAt?: string;
  prompt?: string;
}


export interface ImageModalState {
  // Modal visibility and selected image
  isOpen: boolean;
  selectedImage: SelectedImage | null;

  // Refinement form state
  showRefinementForm: boolean;
  refinementPrompt: string;
  refinementLoading: boolean;
  refinementError: string | null;
  refinementResults: RefinementResult[];

  // Download state
  isDownloading: boolean;
  downloadError: string | null;
}

export interface ImageModalActions {
  openModal: (image: SelectedImage) => void;
  closeModal: () => void;
  openRefinementForm: () => void;
  closeRefinementForm: () => void;
  setRefinementPrompt: (prompt: string) => void;
  setRefinementLoading: (loading: boolean) => void;
  setRefinementError: (error: string | null) => void;
  setRefinementResults: (results: RefinementResult[]) => void;
  setIsDownloading: (downloading: boolean) => void;
  setDownloadError: (error: string | null) => void;
  clearRefinement: () => void;
  reset: () => void;
}

const initialState: ImageModalState = {
  isOpen: false,
  selectedImage: null,
  showRefinementForm: false,
  refinementPrompt: '',
  refinementLoading: false,
  refinementError: null,
  refinementResults: [],
  isDownloading: false,
  downloadError: null
};

export function useImageModal(): ImageModalState & ImageModalActions {
  const [state, setState] = useState<ImageModalState>(initialState);

  const openModal = (image: SelectedImage) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      selectedImage: image,
      showRefinementForm: false,
      refinementPrompt: '',
      refinementError: null,
      refinementResults: [],
      refinementLoading: false
    }));
  };

  const closeModal = () => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      selectedImage: null,
      showRefinementForm: false
    }));
  };

  const openRefinementFormFunc = () => {
    setState((prev) => ({
      ...prev,
      showRefinementForm: true,
      refinementError: null
    }));
  };

  const closeRefinementFormFunc = () => {
    setState((prev) => ({
      ...prev,
      showRefinementForm: false,
      refinementPrompt: '',
      refinementError: null,
      // Keep refinementResults so they can be displayed!
      refinementLoading: false
    }));
  };

  const setRefinementPrompt = (prompt: string) => {
    setState((prev) => ({
      ...prev,
      refinementPrompt: prompt
    }));
  };

  const setRefinementLoading = (loading: boolean) => {
    setState((prev) => ({
      ...prev,
      refinementLoading: loading
    }));
  };

  const setRefinementError = (error: string | null) => {
    setState((prev) => ({
      ...prev,
      refinementError: error
    }));
  };

  const setRefinementResults = (results: RefinementResult[]) => {
    setState((prev) => ({
      ...prev,
      refinementResults: results
    }));
  };

  const setIsDownloading = (downloading: boolean) => {
    setState((prev) => ({
      ...prev,
      isDownloading: downloading
    }));
  };

  const setDownloadError = (error: string | null) => {
    setState((prev) => ({
      ...prev,
      downloadError: error
    }));
  };

  const clearRefinement = () => {
    setState((prev) => ({
      ...prev,
      showRefinementForm: false,
      refinementPrompt: '',
      refinementError: null,
      refinementResults: [],
      refinementLoading: false
    }));
  };

  const reset = () => {
    setState(initialState);
  };

  return {
    // State
    ...state,

    // Actions
    openModal,
    closeModal,
    openRefinementForm: openRefinementFormFunc,
    closeRefinementForm: closeRefinementFormFunc,
    setRefinementPrompt,
    setRefinementLoading,
    setRefinementError,
    setRefinementResults,
    setIsDownloading,
    setDownloadError,
    clearRefinement,
    reset
  };
}
