import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/apiClient.js';

type Mode = 'generation' | 'edit';

export interface UseModeSwitchResult {
  activeMode: Mode;
  setActiveMode: (mode: Mode) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to manage mode switching and sync with backend
 * Automatically saves the active mode to backend preferences
 */
export function useModeSwitch(initialMode: Mode = 'generation'): UseModeSwitchResult {
  const [activeMode, setActiveModeState] = useState<Mode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Switch mode and sync with backend
   */
  const setActiveMode = useCallback(
    async (mode: Mode) => {
      setIsLoading(true);
      setError(null);

      try {
        // Update active mode locally first (for immediate UI feedback)
        setActiveModeState(mode);

        // Sync with backend
        await apiClient.updatePreferences({
          lastActiveMode: mode
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to switch mode';
        setError(errorMsg);
        // Revert mode change on error
        setActiveModeState(activeMode);
      } finally {
        setIsLoading(false);
      }
    },
    [activeMode]
  );

  return {
    activeMode,
    setActiveMode,
    isLoading,
    error
  };
}
