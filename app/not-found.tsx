'use client';

import Link from 'next/link';

export default function NotFound() {
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
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: '7rem',
            fontWeight: 900,
            lineHeight: 1,
            color: '#14b8b8',
            textShadow: '0 0 30px rgba(234, 88, 12, 0.4), 0 0 80px rgba(194, 65, 12, 0.2)',
            marginBottom: '0.5rem',
            letterSpacing: '0.04em',
          }}
        >
          404
        </h1>

        <p
          style={{
            fontFamily: "var(--font-fira-code), 'Fira Code', monospace",
            fontSize: '0.7rem',
            color: '#3a6168',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
          }}
        >
          Page not found
        </p>

        <div
          style={{
            width: '60px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #14b8b8, transparent)',
            margin: '0 auto 2rem',
          }}
        />

        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '0.7rem 2rem',
            borderRadius: '10px',
            border: '1px solid rgba(234, 88, 12, 0.45)',
            background: 'rgba(234, 88, 12, 0.1)',
            color: '#5eead4',
            textDecoration: 'none',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(234, 88, 12, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(234, 88, 12, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(234, 88, 12, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
