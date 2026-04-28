'use client';

import { useAuth } from '@/components/shared/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Shield, ShoppingCart, Users } from 'lucide-react';

const EFFECTIVE_DATE = 'April 28, 2026';

interface Section {
  title: string;
  content: string[];
}

const GENERAL_TERMS: Section[] = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using the Mod Panel platform (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you may not access or use the Service.',
      'These terms apply to all users of the platform, including Owners, Admins, and Resellers.',
    ],
  },
  {
    title: '2. Description of Service',
    content: [
      'Mod Panel is a private license key management platform for authorized game modification software. The Service enables management of license keys, user accounts, referral programs, and optional storefront functionality for reselling keys to end buyers.',
      'Access to the Service is granted exclusively by invite or referral and is subject to the role assigned by the platform Owner.',
    ],
  },
  {
    title: '3. Prohibited Conduct',
    content: [
      'You agree not to: (a) share your login credentials with unauthorized parties; (b) attempt to reverse-engineer, decompile, or otherwise extract the underlying logic of the platform; (c) generate, distribute, or resell keys outside of the platform\'s designated workflows; (d) use the platform to distribute keys for unauthorized or illegal purposes; (e) abuse the referral or free-key systems; (f) circumvent rate limits, captchas, or other abuse prevention mechanisms.',
    ],
  },
  {
    title: '4. Account Suspension & Termination',
    content: [
      'The Owner reserves the right to suspend or permanently ban any account at any time, with or without prior notice, for violation of these Terms or any conduct deemed harmful to the platform or its users.',
      'Upon termination, your access to the Service and any associated keys or data may be revoked immediately.',
    ],
  },
  {
    title: '5. Limitation of Liability',
    content: [
      'The Service is provided "as is" without warranties of any kind. The platform operators are not liable for any indirect, incidental, or consequential damages arising from your use or inability to use the Service.',
      'Key expiration, device limits, and feature availability are managed at the Owner\'s discretion and may change at any time.',
    ],
  },
  {
    title: '6. Privacy & Data',
    content: [
      'Your username, IP address, and activity logs may be recorded for security and abuse prevention purposes. This data is not shared with third parties outside of our secure payment gateway (for store purchases) and Cloudflare Turnstile (for free key generation).',
      'By using the Service, you consent to this data collection as described above.',
    ],
  },
  {
    title: '7. Modifications',
    content: [
      'The platform Owner may update these Terms at any time. Continued use of the Service after any changes constitutes your acceptance of the new Terms.',
    ],
  },
];

const ROLE_TERMS: Record<
  'owner' | 'admin' | 'reseller',
  { label: string; badge: string; badgeVariant: 'default' | 'secondary' | 'outline'; sections: Section[] }
> = {
  owner: {
    label: 'Owner',
    badge: 'Level 1',
    badgeVariant: 'default',
    sections: [
      {
        title: 'Owner Responsibilities',
        content: [
          'As Owner, you have full administrative control over the platform including user management, server configuration, and global settings. You are solely responsible for maintaining the integrity of the platform and ensuring all users under your management comply with these Terms.',
          'You are responsible for the actions taken by Admins and Resellers you have granted access to. Misuse by any managed user reflects on your account.',
          'You must keep your credentials and server configuration secrets (e.g., AUTH_SECRET, MongoDB URI, payment gateway keys) strictly confidential. Exposure of these credentials is your liability.',
        ],
      },
      {
        title: 'Owner Privileges',
        content: [
          'Full access to all platform features: user management, key management, game settings, server configuration, private dashboard, store management, library management, referral administration, and API documentation.',
          'Ability to ban or restore any user, including Admins and Resellers.',
          'Exclusive access to the Private Dashboard and global server configuration.',
        ],
      },
    ],
  },
  admin: {
    label: 'Admin',
    badge: 'Level 2',
    badgeVariant: 'secondary',
    sections: [
      {
        title: 'Admin Responsibilities',
        content: [
          'As Admin, you are granted elevated access to manage keys, referrals, game settings, and your own store. You must not abuse these privileges to circumvent the Owner\'s policies or generate keys beyond your allocated saldo.',
          'You must not share your Admin credentials or perform actions on behalf of other users without explicit authorization from the Owner.',
          'Any actions you perform — including key generation, game setting changes, and store order management — are logged and may be reviewed by the Owner at any time.',
        ],
      },
      {
        title: 'Admin Privileges',
        content: [
          'Access to: Dashboard, Keys, Settings, History, Referrals, Game Settings, Library, API Documentation, and Store (setup, products, orders).',
          'Ability to configure and operate a personal reseller store, with order revenue attributed to your account.',
          'No access to: User Management (admin/users), Server Config, or the Private Dashboard — these are Owner-only.',
        ],
      },
    ],
  },
  reseller: {
    label: 'Reseller',
    badge: 'Level 3',
    badgeVariant: 'outline',
    sections: [
      {
        title: 'Reseller Responsibilities',
        content: [
          'As Reseller, you are authorized to generate and distribute license keys to end users within the limits set by the Owner. You must not resell keys at prices or terms that misrepresent the Service.',
          'You are responsible for the keys you distribute. Keys must only be provided to legitimate end users. Distribution for malicious purposes (e.g., ban evasion, unauthorized game modification at a competitive disadvantage) is prohibited.',
          'You must not attempt to access Admin or Owner-only features, bypass device limits, or manipulate key status outside of the platform\'s intended workflows.',
        ],
      },
      {
        title: 'Reseller Privileges',
        content: [
          'Access to: Dashboard, Keys (generate & manage within saldo), Settings, History.',
          'No access to: Store, Admin panels, User Management, Server Config, Library, Referrals, or API Documentation.',
          'Key generation is limited by the saldo balance assigned by the Owner or Admin.',
        ],
      },
    ],
  },
};

const STORE_TERMS: Section[] = [
  {
    title: 'Store Operations',
    content: [
      'Owners and Admins may configure a personal store to sell license keys to buyers. Payments are processed securely. Store operators are responsible for ensuring their store is accurately described and products are correctly priced.',
      'Minimum product price is ₱20.00 as required by our payment processor.',
    ],
  },
  {
    title: 'Key Delivery',
    content: [
      'License keys are generated and delivered automatically upon successful payment confirmation. Store operators acknowledge that key delivery depends on webhook processing and may be delayed in cases of webhook failure or server downtime.',
      'In cases of payment failure or chargeback, generated keys may be revoked.',
    ],
  },
  {
    title: 'Refund Policy',
    content: [
      'All sales are final. Due to the digital nature of license keys (which are delivered and potentially used immediately upon payment), refunds are generally not available unless the key was provably non-functional at the time of delivery.',
      'Refund requests must be directed to the store operator (Reseller/Admin) who owns the store, not to the platform. The platform operators do not mediate store disputes.',
    ],
  },
  {
    title: 'Buyer Obligations',
    content: [
      'By purchasing from a store on this platform, you acknowledge that: (a) keys are for personal use only; (b) keys must not be shared, resold, or redistributed; (c) device limits are enforced and non-negotiable; (d) keys expire as described at the time of purchase.',
    ],
  },
];

export default function TermsPage() {
  const { user } = useAuth();
  const level = user?.level ?? 3;
  const roleName = level === 1 ? 'owner' : level === 2 ? 'admin' : 'reseller';
  const roleData = ROLE_TERMS[roleName];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Terms of Service</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Effective date: <span className="font-medium text-foreground">{EFFECTIVE_DATE}</span>
        </p>
      </div>

      {/* General Terms */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            General Terms
          </CardTitle>
          <p className="text-sm text-muted-foreground">Applies to all users regardless of role.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {GENERAL_TERMS.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              {section.content.map((paragraph, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Role-Specific Terms */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Your Role — {roleData.label}
            </CardTitle>
            <Badge variant={roleData.badgeVariant} className="text-xs">
              {roleData.badge}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Additional terms and privileges specific to your account role.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {roleData.sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              {section.content.map((paragraph, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Store Terms (visible to Owner and Admin only) */}
      {(level === 1 || level === 2) && (
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Store Terms
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Governs the operation of your reseller store and transactions with buyers.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {STORE_TERMS.map((section) => (
              <div key={section.title} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                {section.content.map((paragraph, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer notice */}
      <p className="text-xs text-muted-foreground pb-4">
        By continuing to use this platform, you acknowledge that you have read, understood, and agree to be bound by
        these Terms of Service. For questions or disputes, contact the platform Owner directly.
      </p>
    </div>
  );
}
