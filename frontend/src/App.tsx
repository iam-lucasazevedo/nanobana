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
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          {loading && <p className="text-muted-foreground">Initializing session...</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center max-w-md mx-auto p-6 glass-card animate-fade-in">
          <h1 className="text-3xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg"></div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Nano Banana
            </h1>
          </div>

          {sessionId && (
            <div className="text-xs font-mono text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Session: {sessionId.substring(0, 8)}...
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Top Controls */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
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
                if (type === 'generation') {
                  setActiveMode('generation');
                } else {
                  setActiveMode('edit');
                }
              }}
            />
          )}
        </div>

        {/* Main Content Area */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {session && (
            <>
              {activeMode === 'generation' && <CreateMode sessionData={session} />}
              {activeMode === 'edit' && <EditMode sessionData={session} />}
            </>
          )}
        </div>

        {/* Status Footer */}
        <div className="mt-12 glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatusItem label="Setup" status="complete" />
            <StatusItem label="Infrastructure" status="complete" />
            <StatusItem label="Text-to-Image" status="complete" />
            <StatusItem label="Image Editing" status="complete" />
            <StatusItem label="Mode Switching" status="in-progress" />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: 'complete' | 'in-progress' | 'pending' }) {
  const colors = {
    complete: 'text-green-400 bg-green-400/10 border-green-400/20',
    'in-progress': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    pending: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  };

  const icons = {
    complete: '✓',
    'in-progress': '⟳',
    pending: '○',
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colors[status]}`}>
      <span className="font-mono font-bold">{icons[status]}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
