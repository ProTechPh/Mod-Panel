'use client';

import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.replace('/login');
  };

  const level = user?.level ?? 3;
  const levelLabel = level === 1 ? 'Owner' : level === 2 ? 'Admin' : 'Reseller';
  const levelColor =
    level === 1
      ? { bg: 'rgba(234, 179, 8, 0.1)', color: 'var(--gold)', border: 'rgba(234, 179, 8, 0.25)' }
      : level === 2
      ? { bg: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.25)' }
      : { bg: 'rgba(234, 88, 12, 0.1)', color: 'var(--teal-3)', border: 'rgba(234, 88, 12, 0.25)' };

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        height: 'var(--nav-h)',
        background: 'var(--bg-deep)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div className="flex h-full items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          style={{ color: 'var(--text-mid)' }}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0 flex items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="Mod Panel Logo"
              width={26}
              height={26}
              unoptimized
              loading="eager"
              className="relative w-7 h-7 object-contain rounded-full"
              style={{ border: '1.5px solid var(--teal-2)', boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)' }}
            />
          </div>
          <h1
            className="text-lg font-bold truncate"
            style={{
              fontFamily: 'var(--ff-display)',
              background: 'linear-gradient(90deg, var(--teal-3), var(--teal-neon))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em',
            }}
          >
            {APP_NAME}
          </h1>
          <Sparkles className="h-3 w-3 shrink-0 hidden sm:block" style={{ color: 'var(--teal-3)', opacity: 0.7 }} />

          <div
            className="hidden lg:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-md"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--ff-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--teal-3)',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--ecto-green)',
              }}
            />
            System Online
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))',
                fontFamily: 'var(--ff-display)',
                letterSpacing: '0.05em',
              }}
            >
              {(user?.fullname || user?.username || '?').slice(0, 2).toUpperCase()}
            </div>
            <span
              className="text-sm truncate max-w-[120px]"
              style={{ color: 'var(--text-mid)', fontFamily: 'var(--ff-body)' }}
            >
              {user?.fullname || user?.username}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: levelColor.bg,
                color: levelColor.color,
                border: `1px solid ${levelColor.border}`,
                fontFamily: 'var(--ff-mono)',
                letterSpacing: '0.08em',
              }}
            >
              {levelLabel}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8"
            style={{ color: 'var(--text-mid)' }}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
