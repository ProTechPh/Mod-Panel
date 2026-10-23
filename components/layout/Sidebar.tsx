'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/shared/AuthProvider';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Key, Users, Gamepad2, Server, HardDrive,
  History, Shield, BookOpen, ScrollText,
  BarChart3, Megaphone, ClipboardList, X,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  minLevel: 1 | 2 | 3;
};

const SECTIONS: { id: string; title: string; items: NavItem[] }[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minLevel: 3 },
      { href: '/keys', label: 'Keys', icon: Key, minLevel: 3 },
      { href: '/history', label: 'History', icon: History, minLevel: 3 },
      { href: '/settings', label: 'Settings', icon: Shield, minLevel: 3 },
      { href: '/lib', label: 'Library', icon: HardDrive, minLevel: 2 },
      { href: '/docs', label: 'API Docs', icon: BookOpen, minLevel: 2 },
      { href: '/terms', label: 'Terms of Service', icon: ScrollText, minLevel: 3 },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users, minLevel: 1 },
      { href: '/admin/ads-analytics', label: 'Ads Analytics', icon: BarChart3, minLevel: 1 },
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone, minLevel: 1 },
      { href: '/admin/game-settings', label: 'Game Settings', icon: Gamepad2, minLevel: 3 },
      { href: '/admin/audit', label: 'Audit Log', icon: ClipboardList, minLevel: 1 },
      { href: '/server', label: 'Server Config', icon: Server, minLevel: 1 },
    ],
  },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const level = user?.level ?? 3;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-[var(--nav-h)] z-40 flex h-[calc(100dvh-var(--nav-h))] w-[var(--sidebar-w)] flex-col border-r border-border transition-transform duration-200 ease-out md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'rgba(11, 12, 16, 0.86)', backdropFilter: 'blur(24px) saturate(1.3)' }}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-3 pt-3 md:hidden">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[var(--text-lo)]">
            Navigation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-mid)] transition-colors hover:bg-white/5 hover:text-[var(--text-hi)]"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-3" style={{ scrollbarWidth: 'thin' }}>
          {SECTIONS.map((section) => {
            const items = section.items.filter((item) => level <= item.minLevel);
            if (items.length === 0) return null;

            return (
              <div key={section.id}>
                <p className="nav-section-label">{section.title}</p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? 'page' : undefined}
                          className={cn('nav-link', active && 'nav-link--active')}
                        >
                          <item.icon className="nav-link-icon" aria-hidden="true" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="size-1.5 rounded-full bg-[var(--ecto-green)]"
              style={{ boxShadow: '0 0 6px var(--ecto-green)' }}
              aria-hidden="true"
            />
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--text-lo)]">
              Console online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
