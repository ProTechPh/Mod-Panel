'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/hooks/useGsapScroll';
import { ChevronDown } from 'lucide-react';

export function ScrollIndicator() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(el,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 1.2, ease: 'power2.out' }
    );
  }, { scope: ref });

  return (
    <div ref={ref} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 scroll-indicator">
      <div className="flex flex-col items-center gap-2 text-white/40">
        <span className="text-xs font-medium tracking-wide uppercase">Scroll</span>
        <ChevronDown className="size-5" />
      </div>
    </div>
  );
}
