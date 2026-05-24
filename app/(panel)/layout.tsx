'use client';

import { useState } from 'react';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { AuthProvider } from '@/components/shared/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background relative">
          {/* Background gradient orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/15 via-fuchsia-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-600/10 via-cyan-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
          </div>

          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="relative z-10 md:ml-56 p-4 md:p-6">
            {children}
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
