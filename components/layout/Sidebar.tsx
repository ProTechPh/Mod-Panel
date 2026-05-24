'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/shared/AuthProvider';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Key, Users, Gamepad2, Server, HardDrive, History, Shield, BookOpen, Smartphone, ShoppingCart, ScrollText, ShieldAlert, BarChart3, Megaphone } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minLevel: 3 },
  { href: '/keys', label: 'Keys', icon: Key, minLevel: 3 },
  { href: '/settings', label: 'Settings', icon: Shield, minLevel: 3 },
  { href: '/history', label: 'History', icon: History, minLevel: 3 },
  { href: '/tiktok-live', label: 'TikTok Live', icon: Smartphone, minLevel: 3 },
  { href: '/store', label: 'Store', icon: ShoppingCart, minLevel: 2 },
  { href: '/admin/users', label: 'Users', icon: Users, minLevel: 1 },
  { href: '/admin/security-reports', label: 'Security Reports', icon: ShieldAlert, minLevel: 1 },
  { href: '/admin/ads-analytics', label: 'Ads Analytics', icon: BarChart3, minLevel: 1 },
  { href: '/admin/ftp-config', label: 'FTP Config', icon: Server, minLevel: 1 },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone, minLevel: 1 },
  { href: '/admin/game-settings', label: 'Game Settings', icon: Gamepad2, minLevel: 3 },
  { href: '/server', label: 'Server Config', icon: Server, minLevel: 1 },
  { href: '/lib', label: 'Library', icon: HardDrive, minLevel: 2 },
  { href: '/docs', label: 'API Docs', icon: BookOpen, minLevel: 2 },
  { href: '/terms', label: 'Terms of Service', icon: ScrollText, minLevel: 3 },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const level = user?.level ?? 3;

  const filteredItems = navItems.filter(item => level <= item.minLevel);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-56 border-r border-border/20 bg-background/70 backdrop-blur-xl transition-transform duration-200 md:translate-x-0 shadow-xl shadow-purple-500/5',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <nav className="relative flex flex-col gap-1 p-3">
          {filteredItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-lg shadow-lg shadow-purple-500/20" />
                )}
                <item.icon className={cn(
                  'relative h-4 w-4 transition-transform duration-200',
                  !isActive && 'group-hover:scale-110'
                )} />
                <span className="relative">{item.label}</span>
                {isActive && (
                  <div className="absolute right-2 w-1 h-4 rounded-full bg-white/60" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
