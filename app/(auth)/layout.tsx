import { ThemeProvider } from '@/components/shared/ThemeProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        {/* Animated gradient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/30 via-fuchsia-500/20 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-600/25 via-cyan-500/20 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-violet-600/10 to-pink-600/10 blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

        {/* Animated floating particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${6 + Math.random() * 8}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-md px-4">
          {children}
        </div>

      </div>
    </ThemeProvider>
  );
}
