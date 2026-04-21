'use client';

import { useAuth } from '@/components/shared/AuthProvider';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <Image src="/logo.jpg" alt="Mod Panel Logo" width={24} height={24} unoptimized loading="eager" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          <h1 className="text-lg font-semibold">{APP_NAME}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.fullname || user?.username} ({user?.level === 1 ? 'Owner' : user?.level === 2 ? 'Admin' : 'Reseller'})
          </span>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}