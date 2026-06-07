export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'var(--bg-void)' }}>
      {/* Animated gradient orbs — teal/cyan cyberpunk */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(20,184,184,0.18) 0%, rgba(13,122,122,0.08) 50%, transparent 70%)', animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(0,255,247,0.12) 0%, rgba(57,255,20,0.06) 50%, transparent 70%)', animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.08) 0%, rgba(20,184,184,0.04) 50%, transparent 70%)', animationDuration: '12s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(20,184,184,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,184,0.03) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* Animated floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: 'rgba(20, 184, 184, 0.4)',
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
  );
}
