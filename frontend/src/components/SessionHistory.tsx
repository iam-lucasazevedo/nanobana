import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SessionHistoryProps {
  recentPrompts: string[];
  recentEditPrompts: string[];
  generationHistory: any[];
  editHistory: any[];
  onPromptSelect: (prompt: string, type: 'generation' | 'edit') => void;
}

export function SessionHistory({
  recentPrompts,
  recentEditPrompts,
  generationHistory,
  editHistory,
  onPromptSelect
}: SessionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'generation' | 'edit'>('generation');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const drawerContent = (
    <>
      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Content */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-card/95 backdrop-blur-md border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out z-[101] ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold">Session History</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex p-2 gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab('generation')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'generation'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              Generations
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'edit'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              Edits
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'generation' ? (
              recentPrompts.length > 0 ? (
                recentPrompts.map((prompt, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onPromptSelect(prompt, 'generation');
                      setIsOpen(false);
                    }}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
                  >
                    <p className="text-sm line-clamp-2">{prompt}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm py-8">No generation history yet</p>
              )
            ) : (
              recentEditPrompts.length > 0 ? (
                recentEditPrompts.map((prompt, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onPromptSelect(prompt, 'edit');
                      setIsOpen(false);
                    }}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
                  >
                    <p className="text-sm line-clamp-2">{prompt}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm py-8">No edit history yet</p>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="glass px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20v-6M6 20V10M18 20V4" />
        </svg>
        History
      </button>

      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}
