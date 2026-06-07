type StatusKey = 'active' | 'expired' | 'blocked' | 'unused' | 'pending' | 'online' | 'offline' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_STYLES: Record<StatusKey, { bg: string; color: string; border: string }> = {
  active:    { bg: 'rgba(57, 255, 20, 0.1)',   color: '#86efac', border: 'rgba(57, 255, 20, 0.3)' },
  success:   { bg: 'rgba(57, 255, 20, 0.1)',   color: '#86efac', border: 'rgba(57, 255, 20, 0.3)' },
  online:    { bg: 'rgba(57, 255, 20, 0.1)',   color: '#86efac', border: 'rgba(57, 255, 20, 0.3)' },
  expired:   { bg: 'rgba(240, 192, 64, 0.1)',  color: '#fcd34d', border: 'rgba(240, 192, 64, 0.3)' },
  warning:   { bg: 'rgba(240, 192, 64, 0.1)',  color: '#fcd34d', border: 'rgba(240, 192, 64, 0.3)' },
  pending:   { bg: 'rgba(240, 192, 64, 0.1)',  color: '#fcd34d', border: 'rgba(240, 192, 64, 0.3)' },
  blocked:   { bg: 'rgba(239, 68, 68, 0.12)',  color: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' },
  danger:    { bg: 'rgba(239, 68, 68, 0.12)',  color: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' },
  offline:   { bg: 'rgba(239, 68, 68, 0.12)',  color: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' },
  unused:    { bg: 'rgba(20, 184, 184, 0.08)', color: 'var(--text-mid)', border: 'var(--border)' },
  info:      { bg: 'rgba(20, 184, 184, 0.1)',  color: 'var(--teal-3)', border: 'rgba(20, 184, 184, 0.3)' },
  neutral:   { bg: 'rgba(20, 184, 184, 0.08)', color: 'var(--text-mid)', border: 'var(--border)' },
};

export function StatusBadge({ status, children, withDot = false }: { status: StatusKey; children: React.ReactNode; withDot?: boolean }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono font-semibold"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.55rem',
        borderRadius: '50px',
      }}
    >
      {withDot && (
        <span
          style={{
            display: 'inline-block',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: s.color,
            boxShadow: `0 0 4px ${s.color}`,
          }}
        />
      )}
      {children}
    </span>
  );
}
