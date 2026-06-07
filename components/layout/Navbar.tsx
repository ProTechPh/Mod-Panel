'use client';

import { useAuth } from '@/components/shared/AuthProvider';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, LogOut, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    sessionStorage.removeItem('telegram_auth_mode');
    router.replace('/login');
  };

  const level = user?.level ?? 3;
  const levelLabel = level === 1 ? 'Owner' : level === 2 ? 'Admin' : 'Reseller';
  const levelColor =
    level === 1
      ? { bg: 'rgba(240, 192, 64, 0.12)', color: 'var(--gold)', border: 'rgba(240, 192, 64, 0.3)' }
      : level === 2
      ? { bg: 'rgba(96, 165, 250, 0.12)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)' }
      : { bg: 'rgba(57, 255, 20, 0.1)', color: 'var(--ecto-green)', border: 'rgba(57, 255, 20, 0.28)' };

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        height: 'var(--nav-h)',
        background: 'rgba(2, 6, 8, 0.85)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 4px 32px rgba(0, 0, 0, 0.4)',
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
          <div className="relative shrink-0">
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))',
                borderRadius: '50%',
                filter: 'blur(6px)',
                opacity: 0.6,
                animation: 'statusPulse 3s infinite',
              }}
            />
            <Image
              src="/logo.jpg"
              alt="Mod Panel Logo"
              width={26}
              height={26}
              unoptimized
              loading="eager"
              className="relative w-7 h-7 object-contain rounded-full"
              style={{ border: '1.5px solid var(--teal-2)', boxShadow: '0 0 12px rgba(20, 184, 184, 0.3)' }}
            />
          </div>
          <h1
            className="text-lg font-bold truncate"
            style={{
              fontFamily: 'var(--ff-display)',
              background: 'linear-gradient(90deg, var(--teal-3), var(--teal-neon))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.1em',
            }}
          >
            {APP_NAME}
          </h1>
          <Sparkles className="h-3 w-3 shrink-0 hidden sm:block" style={{ color: 'var(--teal-3)', opacity: 0.7 }} />

          <div
            className="hidden lg:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-md"
            style={{
              background: 'rgba(20, 184, 184, 0.05)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--ff-mono)',
              fontSize: '0.58rem',
              letterSpacing: '0.15em',
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
                boxShadow: '0 0 6px var(--ecto-green)',
                animation: 'statusPulse 2s infinite',
              }}
            />
            System Online
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(20, 184, 184, 0.05)',
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
            onClick={toggleTheme}
            className="h-8 w-8"
            style={{ color: 'var(--text-mid)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
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
