'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/shared/AuthProvider';
import { Trash2, ShieldAlert, RefreshCcw, Smartphone, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ViolationEntry {
  _id: string;
  keyId: string;
  userDo: string;
  info: string;
  createdAt: string;
}

export default function SecurityReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ViolationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history?type=SECURITY_VIOLATION');
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load security reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;

  const handleClear = async () => {
    if (!confirm('Clear ALL security reports?')) return;
    await fetch('/api/history?type=SECURITY_VIOLATION', { method: 'DELETE' });
    toast.success('Security reports cleared');
    fetchReports();
  };

  const parseInfo = (info: string) => {
    const lines = info.split('\n');
    const device = lines.find(l => l.startsWith('Device:'))?.replace('Device: ', '') || 'Unknown';
    const reason = lines.find(l => l.startsWith('Reason:'))?.replace('Reason: ', '') || 'Unknown';
    const key = lines.find(l => l.startsWith('Key:'))?.replace('Key: ', '') || 'Unknown';
    const serial = lines.find(l => l.startsWith('Serial:'))?.replace('Serial: ', '') || 'Unknown';
    const details = lines.find(l => l.startsWith('Details:'))?.replace('Details: ', '') || 'N/A';
    return { device, reason, key, serial, details };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Security Reports</h2>
            <p className="text-sm text-muted-foreground">Detection of potential crack attempts and bypass violations.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
            <RefreshCcw className={loading ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Key Used</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No security violations detected.</TableCell></TableRow>
              ) : reports.map(entry => {
                const p = parseInfo(entry.info);
                return (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none">
                        CRACK ATTEMPT
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-destructive">{p.reason}</TableCell>
                    <TableCell className="font-mono text-xs">{p.key}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{p.device}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Info className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Violation Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase">Reason</p>
                                <p className="font-semibold text-destructive">{p.reason}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase">Date</p>
                                <p className="font-medium">{new Date(entry.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">Device Info</p>
                              <p className="font-medium bg-muted p-2 rounded text-sm">{p.device}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">Serial / HWID</p>
                              <p className="font-mono text-xs bg-muted p-2 rounded">{p.serial}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">Key Used</p>
                              <p className="font-mono text-xs bg-muted p-2 rounded">{p.key}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">Technical Details</p>
                              <p className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">{p.details}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
