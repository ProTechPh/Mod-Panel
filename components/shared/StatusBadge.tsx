type StatusKey =
  | 'active'
  | 'expired'
  | 'blocked'
  | 'unused'
  | 'pending'
  | 'online'
  | 'offline'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

/**
 * Single source of truth for status colour. Every value resolves through a
 * design token so the badge can never drift from the palette again — the old
 * map hard-coded a neon green and left `info` with a teal background behind
 * orange text.
 */
const STATUS_STYLES: Record<StatusKey, { bg: string; color: string; border: string }> = {
  active:   { bg: 'rgba(34, 197, 94, 0.12)',  color: 'var(--green-soft)', border: 'rgba(34, 197, 94, 0.28)' },
  success:  { bg: 'rgba(34, 197, 94, 0.12)',  color: 'var(--green-soft)', border: 'rgba(34, 197, 94, 0.28)' },
  online:   { bg: 'rgba(34, 197, 94, 0.12)',  color: 'var(--green-soft)', border: 'rgba(34, 197, 94, 0.28)' },
  expired:  { bg: 'rgba(234, 179, 8, 0.12)',  color: 'var(--gold-soft)',  border: 'rgba(234, 179, 8, 0.28)' },
  warning:  { bg: 'rgba(234, 179, 8, 0.12)',  color: 'var(--gold-soft)',  border: 'rgba(234, 179, 8, 0.28)' },
  pending:  { bg: 'rgba(234, 179, 8, 0.12)',  color: 'var(--gold-soft)',  border: 'rgba(234, 179, 8, 0.28)' },
  blocked:  { bg: 'rgba(239, 68, 68, 0.12)',  color: 'var(--red-soft)',   border: 'rgba(239, 68, 68, 0.3)' },
  danger:   { bg: 'rgba(239, 68, 68, 0.12)',  color: 'var(--red-soft)',   border: 'rgba(239, 68, 68, 0.3)' },
  offline:  { bg: 'rgba(239, 68, 68, 0.12)',  color: 'var(--red-soft)',   border: 'rgba(239, 68, 68, 0.3)' },
  info:     { bg: 'rgba(249, 115, 22, 0.12)', color: 'var(--brand-300)',  border: 'rgba(249, 115, 22, 0.3)' },
  unused:   { bg: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-mid)',   border: 'var(--border-hi)' },
  neutral:  { bg: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-mid)',   border: 'var(--border-hi)' },
};

export function StatusBadge({
  status,
  children,
  withDot = false,
}: {
  status: StatusKey;
  children: React.ReactNode;
  withDot?: boolean;
}) {
  const s = STATUS_STYLES[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono font-semibold whitespace-nowrap"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.55rem',
        borderRadius: '50px',
        lineHeight: 1.5,
      }}
    >
      {withDot && (
        <span
          aria-hidden="true"
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
