'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/shared/AuthProvider';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Key, Users, Gamepad2, Server, HardDrive, History, Shield, BookOpen, Smartphone } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minLevel: 3 },
  { href: '/keys', label: 'Keys', icon: Key, minLevel: 3 },
  { href: '/settings', label: 'Settings', icon: Shield, minLevel: 3 },
  { href: '/history', label: 'History', icon: History, minLevel: 3 },
  { href: '/admin/users', label: 'Users', icon: Users, minLevel: 1 },
  { href: '/admin/game-settings', label: 'Game Settings', icon: Gamepad2, minLevel: 2 },
  { href: '/server', label: 'Server Config', icon: Server, minLevel: 1 },
  { href: '/lib', label: 'Library', icon: HardDrive, minLevel: 2 },
  { href: '/docs', label: 'API Docs', icon: BookOpen, minLevel: 2 },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const level = user?.level ?? 3;

  const filteredItems = navItems.filter(item => level <= item.minLevel);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-56 border-r border-border/40 bg-card transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex flex-col gap-1 p-3">
          {filteredItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/40">
          <a
            href="https://release-assets.githubusercontent.com/github-production-release-asset/1214788990/d557441d-5035-40b1-b711-047af969261b"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-[0_0_10px_rgba(147,51,234,0.3)] transition-colors hover:bg-purple-700"
          >
            <Smartphone className="h-4 w-4" />
            Download App
          </a>
        </div>
      </aside>
    </>
  );
}