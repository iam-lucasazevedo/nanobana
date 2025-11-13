import React, { useState, useEffect } from 'react';
import { useSession } from './hooks/useSession.js';
import { useModeSwitch } from './hooks/useModeSwitch.js';
import { CreateMode } from './pages/CreateMode.js';
import { EditMode } from './pages/EditMode.js';
import { ModeSelector } from './components/ModeSelector.js';
import { SessionHistory } from './components/SessionHistory.js';

export default function App() {
  const { session, sessionId, loading, error, initialized, refreshSession } = useSession();
  const { activeMode, setActiveMode } = useModeSwitch('generation');

  // Restore active mode from session on load
  useEffect(() => {
    if (session?.lastActiveMode) {
      setActiveMode(session.lastActiveMode as 'generation' | 'edit');
    }
  }, [session?.lastActiveMode]);

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Loading...</h1>
          {loading && <p className="text-gray-600">Initializing session...</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Nano Banana Image Generator
          </h1>
          {sessionId && (
            <p className="text-gray-600 text-sm mt-2">
              Session: {sessionId.substring(0, 8)}...
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Mode Switcher with History */}
        <div className="mb-8 flex items-center justify-between">
          <ModeSelector
            activeMode={activeMode as 'generation' | 'edit'}
            onModeChange={(mode) => setActiveMode(mode)}
            showLabels={true}
          />
          {session && (
            <SessionHistory
              recentPrompts={session.recentPrompts || []}
              recentEditPrompts={session.recentEditPrompts || []}
              generationHistory={session.generationHistory || []}
              editHistory={session.editHistory || []}
              onPromptSelect={(prompt, type) => {
                // Pre-fill the form with the selected prompt
                if (type === 'generation') {
                  setActiveMode('generation');
                } else {
                  setActiveMode('edit');
                }
              }}
            />
          )}
        </div>

        {/* Mode Content */}
        {session && (
          <>
            {activeMode === 'generation' && <CreateMode sessionData={session} />}
            {activeMode === 'edit' && <EditMode sessionData={session} />}
          </>
        )}

        {/* Status Card */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Implementation Status</h2>
          <p className="text-gray-600 mb-2">
            ✓ Phase 1: Setup complete
          </p>
          <p className="text-gray-600 mb-2">
            ✓ Phase 2: Foundational infrastructure complete
          </p>
          <p className="text-green-600 font-semibold mb-4">
            ✓ Phase 3: Text-to-image generation (US1) complete!
          </p>
          <p className="text-green-600 font-semibold mb-4">
            ✓ Phase 4: Image editing (US2) complete!
          </p>
          <p className="text-blue-600 font-semibold">
            ✓ Phase 5: Mode switching & iteration in development
          </p>
        </div>
      </main>
    </div>
  );
}
