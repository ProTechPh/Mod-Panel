export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'var(--bg-void)' }}>
      {/* Premium launcher-style radial glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px]" 
          style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.04) 0%, transparent 70%)' }} 
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
