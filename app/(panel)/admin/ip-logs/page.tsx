'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/shared/AuthProvider';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface IpLog {
  _id: string;
  ipAddress: string;
  isBanned: boolean;
  banReason: string;
  isp: string;
  org: string;
  isAdClaim: boolean;
  createdAt: string;
}

export default function IpLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<IpLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/ip-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to load IP logs');
      }
    } catch (err) {
      toast.error('Failed to load IP logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;

  const filteredLogs = logs.filter(log => 
    log.ipAddress.includes(search) || 
    (log.isp && log.isp.toLowerCase().includes(search.toLowerCase())) ||
    (log.org && log.org.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IP Security Logs</h2>
          <p className="text-muted-foreground">Monitor banned IPs from free key generation.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search IP, ISP, or Org..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-8" 
          />
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Network Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ban Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Loading logs...</TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No logs found.</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log._id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono">{log.ipAddress}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">{log.isp || 'Unknown ISP'}</span>
                          <span className="text-muted-foreground">{log.org || 'Unknown Org'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {log.isBanned && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Banned</Badge>}
                          {log.isAdClaim ? (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-blue-500/10 text-blue-500 border-blue-500/20">With Ads</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-gray-500/10 text-gray-500 border-gray-500/20">No Ads</Badge>
                          )}
                          {!log.isBanned && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Clean</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.banReason || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
