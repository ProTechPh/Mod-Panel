'use client';

import { UserPlus, KeyRound, Gamepad2 } from 'lucide-react';

const STEPS = [
  {
    icon: <UserPlus size={18} />,
    title: 'Create Account',
    description: 'Sign up with a username and you\'re ready to go. No email verification required.',
    num: '01',
  },
  {
    icon: <KeyRound size={18} />,
    title: 'Get Your Key',
    description: 'Generate a free trial or purchase premium. Instant delivery to your dashboard.',
    num: '02',
  },
  {
    icon: <Gamepad2 size={18} />,
    title: 'Start Using',
    description: 'Launch the application, activate your key, and start using the tools immediately.',
    num: '03',
  },
];

export function HowItWorks() {
  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="section-header">
        <span className="section-label">GETTING STARTED</span>
        <h2 className="section-title">Quick Start Guide</h2>
        <p className="section-description">
          Three simple steps to get up and running.
        </p>
      </div>

      <div className="steps-grid">
        {STEPS.map((step) => (
          <div key={step.num} className="step-card">
            <div className="step-number">{step.num}</div>
            <div className="step-icon">
              {step.icon}
            </div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
