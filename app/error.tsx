'use client';

import { useEffect } from 'react';
import { AlertOctagon } from 'lucide-react';

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
    <div className="state-screen">
      <div className="state-card">
        <span className="state-icon state-icon--danger" aria-hidden="true">
          <AlertOctagon size={26} />
        </span>

        <p className="state-eyebrow">Fault detected</p>
        <h1 className="state-title">System Error</h1>

        <p className="state-sub">{error.message || 'An unexpected error occurred.'}</p>

        {error.digest && <p className="state-code">Digest: {error.digest}</p>}

        {process.env.NODE_ENV === 'development' && error.stack && (
          <details className="state-details">
            <summary className="state-summary">Stack trace</summary>
            <pre className="state-pre">{error.stack}</pre>
          </details>
        )}

        <button type="button" onClick={reset} className="state-btn">
          Try again
        </button>
      </div>
    </div>
  );
}
