'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { Upload, Trash2, Download, Link } from 'lucide-react';
import { toast } from 'sonner';

interface Lib {
  _id: string;
  fileName: string;
  displayName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
}

export default function LibPage() {
  const { user } = useAuth();
  const [libs, setLibs] = useState<Lib[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLibs = async () => {
    try {
      const res = await fetch('/api/libs');
      const data = await res.json();
      setLibs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load libraries');
    }
  };

  useEffect(() => { fetchLibs(); }, []);

  if (user?.level !== 1 && user?.level !== 2) return <p className="text-muted-foreground">Access denied</p>;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.so')) { toast.error('Only .so files allowed'); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/libs', { method: 'POST', body: formData });
      if (res.ok) {
        toast.success('File uploaded');
        fetchLibs();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    const res = await fetch(`/api/libs?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('File deleted');
      fetchLibs();
    } else {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Library</h2>
        <div>
          <input type="file" accept=".so" onChange={handleUpload} disabled={uploading} ref={fileInputRef} className="hidden" id="lib-upload" />
          <label htmlFor="lib-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer", uploading && "pointer-events-none opacity-50")}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload .so'}
          </label>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {libs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No files</TableCell></TableRow>
              ) : libs.map(lib => (
                <TableRow key={lib._id}>
                  <TableCell className="font-mono">{lib.displayName || lib.fileName}</TableCell>
                  <TableCell>{lib.fileSize}</TableCell>
                  <TableCell>{lib.uploadedBy}</TableCell>
                  <TableCell className="text-xs">{lib.uploadedAt ? new Date(lib.uploadedAt).toLocaleString() : ''}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                       <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/libs/serve/${lib.fileName}`); toast.success('Link copied'); }}>
                         <Link className="h-3 w-3" />
                       </Button>
                       <a href={`/api/libs/serve/${lib.fileName}`} target="_blank" rel="noopener noreferrer">
                         <Button variant="ghost" size="sm"><Download className="h-3 w-3" /></Button>
                       </a>
                       <Button variant="ghost" size="sm" onClick={() => handleDelete(lib._id)}>
                         <Trash2 className="h-3 w-3 text-destructive" />
                       </Button>
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