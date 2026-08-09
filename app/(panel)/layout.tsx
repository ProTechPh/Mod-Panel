'use client';

import { useState } from 'react';
import { AuthProvider } from '@/components/shared/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen relative" style={{ background: 'var(--bg-void)' }}>
        {/* Animated ambient space mesh background */}
        <div className="ambient-mesh">
          <div className="ambient-orb-1" />
          <div className="ambient-orb-2" />
        </div>

        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="relative z-10 md:ml-56 p-4 md:p-6">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
