export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8" style={{ background: 'var(--bg-void)' }}>
      {/* Ambient ember wash + tactical grid */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute left-1/2 top-0 h-[720px] w-[720px] -translate-x-1/2 rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.10) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
