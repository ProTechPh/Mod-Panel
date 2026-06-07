'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/shared/AuthProvider';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Key, Users, Gamepad2, Server, HardDrive,
  History, Shield, BookOpen, ScrollText, ShoppingCart,
  BarChart3, Megaphone,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minLevel: 3 },
  { href: '/keys', label: 'Keys', icon: Key, minLevel: 3 },
  { href: '/settings', label: 'Settings', icon: Shield, minLevel: 3 },
  { href: '/history', label: 'History', icon: History, minLevel: 3 },
  { href: '/store', label: 'Store', icon: ShoppingCart, minLevel: 2 },
  { href: '/admin/users', label: 'Users', icon: Users, minLevel: 1 },
  { href: '/admin/ads-analytics', label: 'Ads Analytics', icon: BarChart3, minLevel: 1 },
  { href: '/admin/ftp-config', label: 'FTP Config', icon: Server, minLevel: 1 },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone, minLevel: 1 },
  { href: '/admin/game-settings', label: 'Game Settings', icon: Gamepad2, minLevel: 3 },
  { href: '/server', label: 'Server Config', icon: Server, minLevel: 1 },
  { href: '/lib', label: 'Library', icon: HardDrive, minLevel: 2 },
  { href: '/docs', label: 'API Docs', icon: BookOpen, minLevel: 2 },
  { href: '/terms', label: 'Terms of Service', icon: ScrollText, minLevel: 3 },
];

const sectionTitle = (label: string) => (
  <div
    style={{
      fontFamily: 'var(--ff-mono)',
      fontSize: '0.55rem',
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: 'var(--text-lo)',
      padding: '0.5rem 0.75rem 0.4rem',
      marginTop: '0.5rem',
    }}
  >
    {label}
  </div>
);

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const level = user?.level ?? 3;

  const filteredItems = navItems.filter(item => level <= item.minLevel);

  // Group items
  const userItems = filteredItems.filter(i =>
    ['/dashboard', '/keys', '/history', '/settings', '/terms', '/store', '/lib', '/docs'].includes(i.href)
  );
  const adminItems = filteredItems.filter(i => i.href.startsWith('/admin/') || i.href === '/server');

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-56 transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'rgba(2, 6, 8, 0.92)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          borderRight: '1px solid var(--border)',
          boxShadow: '8px 0 32px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(20, 184, 184, 0.08)',
        }}
      >
        <nav
          className="relative flex flex-col gap-0.5 p-3 overflow-y-auto h-full"
          style={{ scrollbarWidth: 'thin' }}
        >
          {userItems.length > 0 && sectionTitle('Workspace')}
          {userItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 overflow-hidden'
                )}
                style={{
                  fontFamily: 'var(--ff-body)',
                  color: isActive ? '#fff' : 'var(--text-mid)',
                  background: isActive ? 'transparent' : 'transparent',
                  letterSpacing: '0.01em',
                }}
              >
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, rgba(20, 184, 184, 0.18), rgba(20, 184, 184, 0.04))',
                      border: '1px solid rgba(20, 184, 184, 0.3)',
                      borderRadius: '8px',
                      boxShadow: '0 0 14px rgba(20, 184, 184, 0.2), inset 0 1px 0 rgba(20, 184, 184, 0.15)',
                    }}
                  />
                )}
                <item.icon
                  className={cn(
                    'relative h-4 w-4 transition-transform duration-200',
                    !isActive && 'group-hover:scale-110'
                  )}
                  style={{ color: isActive ? 'var(--teal-2)' : 'currentColor' }}
                />
                <span className="relative">{item.label}</span>
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      width: '4px',
                      height: '16px',
                      borderRadius: '2px',
                      background: 'var(--teal-neon)',
                      boxShadow: '0 0 8px var(--teal-neon)',
                    }}
                  />
                )}
              </Link>
            );
          })}

          {adminItems.length > 0 && sectionTitle('Admin')}
          {adminItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 overflow-hidden'
                )}
                style={{
                  fontFamily: 'var(--ff-body)',
                  color: isActive ? '#fff' : 'var(--text-mid)',
                  letterSpacing: '0.01em',
                }}
              >
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, rgba(20, 184, 184, 0.18), rgba(20, 184, 184, 0.04))',
                      border: '1px solid rgba(20, 184, 184, 0.3)',
                      borderRadius: '8px',
                      boxShadow: '0 0 14px rgba(20, 184, 184, 0.2), inset 0 1px 0 rgba(20, 184, 184, 0.15)',
                    }}
                  />
                )}
                <item.icon
                  className={cn(
                    'relative h-4 w-4 transition-transform duration-200',
                    !isActive && 'group-hover:scale-110'
                  )}
                  style={{ color: isActive ? 'var(--teal-2)' : 'currentColor' }}
                />
                <span className="relative">{item.label}</span>
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      width: '4px',
                      height: '16px',
                      borderRadius: '2px',
                      background: 'var(--teal-neon)',
                      boxShadow: '0 0 8px var(--teal-neon)',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
