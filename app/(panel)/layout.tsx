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
        <div className="min-h-screen bg-background">
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="md:ml-56 p-4 md:p-6">
            {children}
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}