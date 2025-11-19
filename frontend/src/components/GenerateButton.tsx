import React from 'react';

interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  label?: string;
}

export function GenerateButton({ onClick, loading, disabled, label = 'Generate' }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        relative group w-full py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-200
        ${loading || disabled
          ? 'bg-muted cursor-not-allowed opacity-70'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]'
        }
      `}
    >
      {!loading && !disabled && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200 blur-md" />
      )}

      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            {label}
          </>
        )}
      </span>
    </button>
  );
}
