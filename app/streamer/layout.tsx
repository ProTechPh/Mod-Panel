import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { StreamerAuthProvider } from '@/components/shared/StreamerAuthProvider';

export default function StreamerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <StreamerAuthProvider>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </StreamerAuthProvider>
    </ThemeProvider>
  );
}
