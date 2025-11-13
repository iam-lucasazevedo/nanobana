import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient.js';

export interface SessionData {
  sessionId: string;
  recentPrompts: string[];
  recentEditPrompts: string[];
  preferredSize: string;
  preferredStyle: string;
  preferredAspectRatio: string;
  lastActiveMode: 'generation' | 'edit';
  generationHistory: any[];
  editHistory: any[];
  createdAt: string;
}

export interface UseSessionResult {
  session: SessionData | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initSession: () => Promise<void>;
  updatePreferences: (prefs: Partial<SessionData>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Custom hook to manage session state and initialization
 */
export function useSession(): UseSessionResult {
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if we have a stored session ID
        const storedSessionId = localStorage.getItem('sessionId');

        if (storedSessionId) {
          // Try to restore existing session
          apiClient.setSessionId(storedSessionId);
          setSessionId(storedSessionId);

          try {
            const sessionData = await apiClient.getSession();
            setSession(sessionData);
          } catch (err) {
            // Session invalid, create new one
            const newSessionId = await apiClient.initSession();
            setSessionId(newSessionId);
            const sessionData = await apiClient.getSession();
            setSession(sessionData);
          }
        } else {
          // Create new session
          const newSessionId = await apiClient.initSession();
          setSessionId(newSessionId);
          const sessionData = await apiClient.getSession();
          setSession(sessionData);
        }

        setInitialized(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize session';
        setError(errorMsg);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newSessionId = await apiClient.initSession();
      setSessionId(newSessionId);
      const sessionData = await apiClient.getSession();
      setSession(sessionData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize session';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<SessionData>) => {
    setError(null);

    try {
      await apiClient.updatePreferences(prefs);
      // Refresh session to get updated data
      const sessionData = await apiClient.getSession();
      setSession(sessionData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMsg);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setError(null);

    try {
      const sessionData = await apiClient.getSession();
      setSession(sessionData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh session';
      setError(errorMsg);
    }
  }, []);

  return {
    session,
    sessionId,
    loading,
    error,
    initialized,
    initSession,
    updatePreferences,
    refreshSession
  };
}
