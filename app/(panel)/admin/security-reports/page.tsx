'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles } from 'lucide-react';

interface Report { _id: string; username: string; email: string; reason: string; reportedDate: string; status: string; }

export default function SecurityReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => { fetch('/api/admin/security-reports').then(r => r.json()).then(setReports).catch(() => {}); }, []);

  const gc = "relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden";
  const gh = "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Security Reports</h2>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className={gc}>
          <div className={gh} />
          <CardHeader><CardTitle className="text-lg">Reported Users</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(r => (
                  <TableRow key={r._id}>
                    <TableCell><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-destructive" />{r.username}</div></TableCell>
                    <TableCell className="text-xs">{r.email}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{r.reason}</TableCell>
                    <TableCell className="text-xs">{r.reportedDate ? new Date(r.reportedDate).toLocaleDateString() : ''}</TableCell>
                    <TableCell><Badge variant={r.status === 'resolved' ? 'default' : 'destructive'}>{r.status || 'pending'}</Badge></TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No reports</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
