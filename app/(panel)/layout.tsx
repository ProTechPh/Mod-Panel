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
        {/* Morphing background blobs */}
        <div className="morphbg">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
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
