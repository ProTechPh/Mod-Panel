'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/shared/AuthProvider';
import { Trash2, History as HistoryIcon, User as UserIcon, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';

interface HistoryEntry { _id: string; keyId: string; userDo: string; info: string; createdAt: string; }

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch { toast.error('Failed to load history'); }
    })();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load history'); }
  };
  const handleClear = async () => { if (!confirm('Clear all your history?')) return; await fetch('/api/history', { method: 'DELETE' }); toast.success('History cleared'); void fetchHistory(); };
  const handleClearAll = async () => { if (!confirm('Clear ALL history? This cannot be undone.')) return; await fetch('/api/history?all=true', { method: 'DELETE' }); toast.success('All history cleared'); void fetchHistory(); };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Audit Trail"
        title="ACTIVITY"
        highlight="HISTORY"
        sub="Inspect key-related events and operator actions across the system."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear Mine
            </Button>
            {user?.level === 1 && (
              <Button variant="destructive" onClick={handleClearAll}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear All
              </Button>
            )}
          </div>
        }
      />

      <Card className="fade-up d1">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Info</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <div className="empty-state" style={{ padding: '1rem' }}>
                      <div className="empty-icon-ring"><HistoryIcon size={22} /></div>
                      <div className="empty-title">No History</div>
                      <div className="empty-sub">No activity recorded yet.</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : history.map(entry => (
                <TableRow key={entry._id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="h-3 w-3" style={{ color: 'var(--teal-2)' }} />
                      <span className="font-mono" style={{ color: 'var(--text-hi)' }}>{entry.userDo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-mid)' }}>
                      <FileText className="h-3 w-3" style={{ color: 'var(--text-lo)' }} />
                      <span className="font-mono">{entry.info}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-mid)' }}>
                      <Clock className="h-3 w-3" style={{ color: 'var(--text-lo)' }} />
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
