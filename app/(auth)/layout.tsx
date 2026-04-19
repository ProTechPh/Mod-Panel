import { ThemeProvider } from '@/components/shared/ThemeProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md px-4">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}