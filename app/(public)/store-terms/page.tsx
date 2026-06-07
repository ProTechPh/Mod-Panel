'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, ShoppingCart, ShieldAlert } from 'lucide-react';

const EFFECTIVE_DATE = 'April 28, 2026';

const STORE_TERMS = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By accessing the store or making a purchase on this platform, you agree to be bound by these Store Terms of Service.',
      'If you do not agree to all terms and conditions, do not make a purchase.',
    ],
  },
  {
    title: '2. License Keys',
    content: [
      'You are purchasing a digital license key for personal use only. Keys grant access to specific software modifications for a defined duration and a limited number of devices.',
      'Keys are non-transferable and may not be resold or redistributed. Sharing your key with others will result in the key being permanently banned without refund.',
    ],
  },
  {
    title: '3. Device Limits',
    content: [
      'Each key has a maximum device limit (typically 1 device unless stated otherwise).',
      'The platform tracks device serials. Attempting to use the key on more devices than permitted will automatically block the key.',
    ],
  },
  {
    title: '4. Delivery & Payments',
    content: [
      'Payments are processed securely via our payment gateway.',
      'Keys are delivered digitally and instantly upon successful payment confirmation. Please copy and save your key immediately after purchase.',
      'In rare cases of network delay, the key delivery may take a few minutes. Please retain your transaction reference.',
    ],
  },
  {
    title: '5. Refund Policy',
    content: [
      'ALL SALES ARE FINAL.',
      'Due to the digital nature of the license keys, which are delivered and can be used immediately upon purchase, we do not offer refunds, returns, or exchanges.',
      'Exceptions are only made if the key is proven to be non-functional at the exact time of delivery due to a system error on our end. Issues with your personal device or game client are not grounds for a refund.',
    ],
  },
  {
    title: '6. Account & Key Suspension',
    content: [
      'We reserve the right to suspend or terminate any key without refund if we detect abuse, chargebacks, fraudulent payments, or violations of these terms.',
      'Using the provided software to gain an unfair advantage in online games is done at your own risk. We are not responsible for any game account bans or suspensions you may incur.',
    ],
  },
  {
    title: '7. Scam & Abandonment Protection',
    content: [
      'If you believe you have been scammed (e.g., the purchased mod does not work as advertised) or if the seller has abandoned the project, you are eligible for an investigation to process a refund.',
      'IMPORTANT: You must report the issue within 3 days of your purchase. If the 3-day limit is exceeded, your request will no longer be processed for a refund.',
      'To report a scam or abandoned mod, please contact us directly on Telegram for investigation: https://t.me/CanKillYouForever',
    ],
  },
];

export default function StoreTermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-void)' }}>
      <header className="sticky top-0 z-10 border-b border-border/50" style={{ background: 'rgba(2, 6, 8, 0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" style={{ color: 'var(--teal-2)' }} />
            <span className="font-semibold" style={{ color: 'var(--text-hi)' }}>Store Terms</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ScrollText className="h-6 w-6" style={{ color: 'var(--teal-2)' }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-hi)' }}>Store Terms of Service</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-mid)' }}>
            Effective date: <span className="font-medium" style={{ color: 'var(--text-hi)' }}>{EFFECTIVE_DATE}</span>
          </p>
        </div>

        <Card className="border-border/50" style={{ background: 'rgba(9, 19, 24, 0.85)' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
              Buyer Agreement
            </CardTitle>
            <p className="text-sm" style={{ color: 'var(--text-mid)' }}>
              Please read these terms carefully before completing your purchase.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {STORE_TERMS.map((section) => (
              <div key={section.title} className="space-y-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-hi)' }}>{section.title}</h3>
                {section.content.map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-center" style={{ color: 'var(--text-mid)' }}>
          For basic key issues, please contact the store owner directly. 
          However, if you suspect a scam or an abandoned project, contact our platform administration immediately via Telegram for investigation and refund processing.
        </p>
      </main>
    </div>
  );
}
