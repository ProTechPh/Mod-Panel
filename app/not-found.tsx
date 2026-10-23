import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="state-screen">
      <div className="state-card">
        <span className="state-icon state-icon--brand" aria-hidden="true">
          <Compass size={26} />
        </span>

        <p className="state-eyebrow">Signal lost</p>
        <p className="state-title state-title--code">404</p>
        <h1 className="state-title">Page not found</h1>

        <p className="state-sub">
          This route is not part of the console. It may have been moved, renamed, or never existed.
        </p>

        <Link href="/dashboard" className="state-btn">
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
