'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/shared/AuthProvider';
import { Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HistoryEntry { _id: string; keyId: string; userDo: string; info: string; createdAt: string; }

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const fetchHistory = async () => {
    try { const res = await fetch('/api/history'); const data = await res.json(); setHistory(Array.isArray(data) ? data : []); } catch { toast.error('Failed to load history'); }
  };
  useEffect(() => { fetchHistory(); }, []);

  const handleClear = async () => { if (!confirm('Clear all your history?')) return; await fetch('/api/history', { method: 'DELETE' }); toast.success('History cleared'); fetchHistory(); };
  const handleClearAll = async () => { if (!confirm('Clear ALL history? This cannot be undone.')) return; await fetch('/api/history?all=true', { method: 'DELETE' }); toast.success('All history cleared'); fetchHistory(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">History</h2>
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClear} className="border-border/50"><Trash2 className="h-4 w-4 mr-2" />Clear Mine</Button>
          {user?.level === 1 && <Button variant="destructive" onClick={handleClearAll}><Trash2 className="h-4 w-4 mr-2" />Clear All</Button>}
        </div>
      </div>
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>User</TableHead><TableHead>Info</TableHead><TableHead>Date</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No history</TableCell></TableRow>
                ) : history.map(entry => (
                  <TableRow key={entry._id}>
                    <TableCell>{entry.userDo}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.info}</TableCell>
                    <TableCell className="text-xs">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
