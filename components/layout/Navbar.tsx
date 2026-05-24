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

  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background/70 backdrop-blur-xl shadow-lg shadow-purple-500/5">
      <div className="flex h-14 items-center px-4 gap-4">
        <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full blur-md opacity-60 animate-pulse" style={{ animationDuration: '3s' }} />
            <Image src="/logo.jpg" alt="Mod Panel Logo" width={24} height={24} unoptimized loading="eager" className="relative w-6 h-6 object-contain rounded-full ring-1 ring-purple-500/30" />
          </div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">{APP_NAME}</h1>
          <Sparkles className="h-3 w-3 text-purple-400/60 hidden sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
              {(user?.fullname || user?.username || '?').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm text-muted-foreground">
              {user?.fullname || user?.username}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              user?.level === 1 ? 'bg-yellow-500/20 text-yellow-400' :
              user?.level === 2 ? 'bg-blue-500/20 text-blue-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {user?.level === 1 ? 'Owner' : user?.level === 2 ? 'Admin' : 'Reseller'}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
