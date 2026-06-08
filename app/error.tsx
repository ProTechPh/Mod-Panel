'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020608',
        fontFamily: "var(--font-syne), 'Syne', sans-serif",
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '2.5rem',
          borderRadius: '16px',
          background: '#091318',
          border: '1px solid rgba(20, 184, 184, 0.18)',
          boxShadow: '0 0 30px rgba(20, 184, 184, 0.4), 0 0 80px rgba(13, 122, 122, 0.2)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#e8f8f8',
            letterSpacing: '0.04em',
            marginBottom: '0.5rem',
          }}
        >
          System Error
        </h1>

        <p
          style={{
            color: '#8ab8be',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            marginBottom: '0.75rem',
          }}
        >
          {error.message || 'An unexpected error occurred.'}
        </p>

        {error.digest && (
          <p
            style={{
              fontFamily: "var(--font-fira-code), 'Fira Code', monospace",
              fontSize: '0.65rem',
              color: '#3a6168',
              letterSpacing: '0.08em',
              marginBottom: '1.5rem',
            }}
          >
            Digest: {error.digest}
          </p>
        )}

        {process.env.NODE_ENV === 'development' && error.stack && (
          <details
            style={{
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            <summary
              style={{
                fontFamily: "var(--font-fira-code), 'Fira Code', monospace",
                fontSize: '0.65rem',
                color: '#8ab8be',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.5rem 0',
              }}
            >
              Stack Trace
            </summary>
            <pre
              style={{
                marginTop: '0.5rem',
                padding: '1rem',
                borderRadius: '8px',
                background: '#020608',
                border: '1px solid rgba(20, 184, 184, 0.1)',
                overflowX: 'auto',
                fontFamily: "var(--font-fira-code), 'Fira Code', monospace",
                fontSize: '0.65rem',
                lineHeight: 1.7,
                color: '#8ab8be',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}

        <button
          onClick={reset}
          style={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '0.7rem 2rem',
            borderRadius: '10px',
            border: '1px solid rgba(20, 184, 184, 0.45)',
            background: 'rgba(20, 184, 184, 0.1)',
            color: '#5eead4',
            cursor: 'pointer',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(20, 184, 184, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(20, 184, 184, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(20, 184, 184, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
