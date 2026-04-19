'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import ReferralsTable from '@/components/shared/ReferralsTable';

interface Referral {
  _id: string;
  code: string;
  level: number;
  setSaldo: number;
  usedBy: string;
  createdBy: string;
  accExpiration: string;
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const fetchReferrals = async () => {
    const res = await fetch('/api/referrals');
    const data = await res.json();
    setReferrals(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchReferrals(); }, []);

  if (user?.level !== 1 && user?.level !== 2) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Referrals</h2>
      <ReferralsTable referrals={referrals} onRefresh={fetchReferrals} />
    </div>
  );
}