'use client';

import { useAuth } from '@/components/shared/AuthProvider';
import { Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

const LEVEL_STYLES = {
  1: { label: 'Owner', color: 'var(--gold)', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)' },
  2: { label: 'Admin', color: '#93c5fd', bg: 'rgba(96, 165, 250, 0.12)', border: 'rgba(96, 165, 250, 0.3)' },
  3: { label: 'Reseller', color: 'var(--brand-300)', bg: 'rgba(234, 88, 12, 0.12)', border: 'rgba(234, 88, 12, 0.3)' },
} as const;

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.replace('/login');
  };

  const level = (user?.level ?? 3) as 1 | 2 | 3;
  const badge = LEVEL_STYLES[level];

  return (
    <header
      className="sticky top-0 z-40 h-[var(--nav-h)] border-b border-border"
      style={{
        background: 'rgba(11, 12, 16, 0.82)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        boxShadow: '0 1px 0 rgba(255, 255, 255, 0.03), 0 8px 24px rgba(0, 0, 0, 0.28)',
      }}
    >
      <div className="flex h-full items-center gap-3 px-3 sm:px-4">
        {/* Mobile nav toggle — 40px hit area */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-mid)] transition-colors hover:bg-white/5 hover:text-[var(--text-hi)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)] md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Image
            src="/logo.jpg"
            alt=""
            width={28}
            height={28}
            unoptimized
            loading="eager"
            priority
            className="size-7 shrink-0 rounded-full object-contain"
            style={{
              border: '1px solid rgba(234, 88, 12, 0.55)',
              boxShadow: '0 0 12px rgba(234, 88, 12, 0.28)',
            }}
          />

          <span
            className="truncate text-[0.95rem] font-extrabold uppercase"
            style={{
              fontFamily: 'var(--ff-display)',
              letterSpacing: '0.08em',
              background: 'linear-gradient(90deg, var(--brand-300), var(--brand-glow))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {APP_NAME}
          </span>

          <span className="topbar-status hidden lg:inline-flex" aria-hidden="true">
            <span className="topbar-status-dot" />
            System online
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-white/[0.02] py-1 pl-1 pr-2.5 sm:flex">
            <span
              className="flex size-7 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
              style={{
                fontFamily: 'var(--ff-display)',
                background: 'linear-gradient(135deg, var(--brand-700), var(--brand-600))',
              }}
              aria-hidden="true"
            >
              {(user?.fullname || user?.username || '?').slice(0, 2).toUpperCase()}
            </span>

            <span className="max-w-[140px] truncate text-[0.8rem] text-[var(--text-mid)]">
              {user?.fullname || user?.username}
            </span>

            <span
              className="rounded-full px-1.5 py-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.08em]"
              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
            >
              {badge.label}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex size-9 items-center justify-center rounded-lg text-[var(--text-mid)] transition-colors hover:bg-destructive/10 hover:text-[var(--red-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)]"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
