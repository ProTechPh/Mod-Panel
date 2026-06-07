'use client';

import { UserPlus, KeyRound, Gamepad2 } from 'lucide-react';
import '@/components/landing/landing.css';

const STEPS = [
  {
    icon: <UserPlus className="size-5" />,
    title: 'Create Account',
    description: 'Sign up in seconds — just a username and you\'re in. No email verification, no waiting.',
    color: 'var(--teal-2)',
    bg: 'rgba(20, 184, 184, 0.08)',
    border: 'rgba(20, 184, 184, 0.2)',
    num: '01',
  },
  {
    icon: <KeyRound className="size-5" />,
    title: 'Get Your Key',
    description: 'Generate a free trial or buy premium. Instant delivery straight to your dashboard.',
    color: 'var(--gold)',
    bg: 'rgba(240, 192, 64, 0.08)',
    border: 'rgba(240, 192, 64, 0.2)',
    num: '02',
  },
  {
    icon: <Gamepad2 className="size-5" />,
    title: 'Start Dominating',
    description: 'Launch the mod, activate your key, and experience the game at a whole new level.',
    color: 'var(--ecto-green)',
    bg: 'rgba(57, 255, 20, 0.08)',
    border: 'rgba(57, 255, 20, 0.2)',
    num: '03',
  },
];

export function HowItWorks() {
  return (
    <div className="panel fade-up d3 panel-corner" id="how-it-works">
      <div className="panel-head">
        <div className="panel-title">
          <svg className="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Quick Start Protocol
        </div>
        <span className="panel-badge">3 steps</span>
      </div>

      <div className="step-list" style={{ padding: '1.4rem 1.1rem 1.1rem' }}>
        {STEPS.map((step) => (
          <div
            key={step.num}
            className="step-item"
            style={{
              '--step-color': step.color,
              '--step-bg': step.bg,
              '--step-border': step.border,
            } as React.CSSProperties}
          >
            <span className="step-num" style={{ background: step.color }}>
              {step.num}
            </span>
            <div className="step-icon" style={{ background: step.bg, color: step.color, borderColor: step.border }}>
              {step.icon}
            </div>
            <div className="step-title">{step.title}</div>
            <p className="step-desc">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
