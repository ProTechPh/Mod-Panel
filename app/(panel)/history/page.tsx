'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/shared/AuthProvider';
import { Trash2, History as HistoryIcon, User as UserIcon, FileText, Clock, Terminal, ShieldAlert } from 'lucide-react';
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
  
  const handleClear = async () => { 
    if (!confirm('Clear all your history?')) return; 
    await fetch('/api/history', { method: 'DELETE' }); 
    toast.success('History cleared'); 
    void fetchHistory(); 
  };
  
  const handleClearAll = async () => { 
    if (!confirm('Clear ALL history? This cannot be undone.')) return; 
    await fetch('/api/history?all=true', { method: 'DELETE' }); 
    toast.success('All history cleared'); 
    void fetchHistory(); 
  };

  if (!user) return <p className="text-muted-foreground">Loading…</p>;

  const levelLabel = user.level === 1 ? 'Owner' : user.level === 2 ? 'Admin' : 'Reseller';

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Audit Trail"
        title="ACTIVITY"
        highlight="HISTORY"
        sub="Inspect key-related events and operator actions across the system."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_2.2fr] items-start">
        {/* Left Column: Audit Diagnostics HUD */}
        <div className="space-y-4 fade-up d1">
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">
                <ShieldAlert size={14} className="text-orange-500 animate-pulse" />
                <span>Audit Diagnostics</span>
              </h2>
              <span className="panel-badge">MONITOR</span>
            </div>
            
            <div className="p-4 space-y-4 font-sans text-xs">
              <div className="rounded-lg p-3 bg-black/25 border border-white/5 space-y-3 font-mono">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-500">Operator:</span>
                  <span className="text-white font-bold">{user.username}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-500">Clearance:</span>
                  <span className="text-orange-500 font-bold uppercase">{levelLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Decrypted Logs:</span>
                  <span className="text-white font-bold">{history.length} Entries</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="outline" onClick={handleClear} className="w-full flex items-center justify-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Clear My Log
                </Button>
                {user.level === 1 && (
                  <Button variant="destructive" onClick={handleClearAll} className="w-full flex items-center justify-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" /> Purge Global Audit Log
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Decrypted Event Log Table */}
        <div className="panel fade-up d2">
          <div className="panel-head">
            <h2 className="panel-title flex items-center gap-2">
              <Terminal size={14} className="text-orange-500" />
              <span>Decrypted Event Log Feed</span>
            </h2>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">{'// status: live feed'}</span>
          </div>

          <div className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Action Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <div className="empty-state" style={{ padding: '1rem' }}>
                        <div className="empty-icon-ring"><HistoryIcon size={22} /></div>
                        <div className="empty-title">No Logs Decrypted</div>
                        <div className="empty-sub">No recent system activity recorded.</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : history.map(entry => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="h-3 w-3 text-orange-500" />
                        <span className="font-mono text-white text-xs">{entry.userDo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <FileText className="h-3 w-3 text-slate-500" />
                        <span className="font-mono">{entry.info}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3 w-3 text-slate-600" />
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
