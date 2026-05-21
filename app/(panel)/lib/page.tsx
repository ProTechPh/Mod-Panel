'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { Upload, Trash2, Download, Link, Code, X, Copy, Check, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Lib {
  _id: string;
  fileName: string;
  displayName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
}

function generateSnippet(lib: Lib, origin: string): string {
  const libsListUrl = `${origin}/api/libs/list?uploadedBy=${lib.uploadedBy}`;
  return `\t// Dynamic lib fetch — no hardcoded values needed
\t// The app fetches available libs from:
\t// ${libsListUrl}
\t//
\t// Make sure LIBS_LIST_URL in MainActivity uses the correct uploadedBy value.
\t// Your uploadedBy: "${lib.uploadedBy}"
\t//
\t// Display name: "${lib.displayName}"
\t// File name:    "${lib.fileName}"
\t// Download URL: ${origin}/api/libs/serve/${lib.fileName}`;
}

function SnippetModal({ lib, onClose }: { lib: Lib; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const snippet = generateSnippet(lib, origin);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-border/50 bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Java Snippet</span>
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{lib.fileName}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs text-muted-foreground mb-3">
            Dynamic na kino-fetch ng <code className="bg-muted px-1 rounded">MainActivity</code> ang libs mula sa <code className="bg-muted px-1 rounded">/api/libs/list?uploadedBy=WINTER</code>.
            Hindi na kailangan ng hardcoded snippet — i-upload mo lang ang lib at automatic na lalabas sa app.
          </p>

          {/* Info */}
          <div className="mb-3 rounded-lg bg-muted/50 border border-border/30 px-3 py-2 space-y-1">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Display name:</span> {lib.displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">File name:</span> {lib.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Uploaded by:</span> {lib.uploadedBy}
            </p>
          </div>
        </div>

        {/* Code block */}
        <div className="relative mx-5 mb-5">
          <pre className="overflow-x-auto rounded-lg bg-[#0d0d1a] border border-border/30 p-4 text-xs font-mono text-green-400 max-h-72">
            {snippet}
          </pre>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-7 gap-1.5 text-xs"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LibPage() {
  const { user } = useAuth();
  const [libs, setLibs] = useState<Lib[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [snippetLib, setSnippetLib] = useState<Lib | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
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
    setUploadProgress(0);
    setUploadFileName(file.name);
    const CHUNK_SIZE = 3 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('fileName', file.name);
        formData.append('chunkIndex', String(i));
        formData.append('totalChunks', String(totalChunks));
        formData.append('totalSize', String(file.size));

        const res = await fetch('/api/libs/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Upload failed');
          return;
        }
        const chunkProgress = ((i + 1) / totalChunks) * 95;
        setUploadProgress(Math.round(chunkProgress));
      }
      setUploadProgress(100);
      toast.success('File uploaded successfully');
      fetchLibs();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async (id: string, displayName: string) => {
    try {
      const res = await fetch('/api/libs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, displayName }),
      });
      if (!res.ok) { toast.error('Update failed'); return; }
      toast.success('Display name updated');
      setEditingId(null);
      fetchLibs();
    } catch {
      toast.error('Update failed');
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
    <>
      {snippetLib && <SnippetModal lib={snippetLib} onClose={() => setSnippetLib(null)} />}

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

        {uploading && (
          <div className="space-y-2 rounded-lg border border-border/50 bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[200px] font-mono">{uploadFileName}</span>
              <span className="text-foreground font-medium tabular-nums">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
            <p className="text-xs text-muted-foreground">
              {uploadProgress < 95 ? 'Uploading chunks...' : uploadProgress < 100 ? 'Finalizing upload...' : 'Done!'}
            </p>
          </div>
        )}

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
                    <TableCell className="font-mono">
                      {editingId === lib._id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="h-7 w-40 rounded border border-border bg-background px-2 text-xs font-mono outline-none focus:border-primary"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleUpdate(lib._id, editValue);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <Button variant="ghost" size="sm" onClick={() => handleUpdate(lib._id, editValue)} className="h-7 w-7">
                            <Save className="h-3 w-3 text-green-500" />
                          </Button>
                        </div>
                      ) : (
                        <span className="cursor-default">{lib.displayName || lib.fileName}</span>
                      )}
                    </TableCell>
                    <TableCell>{lib.fileSize}</TableCell>
                    <TableCell>{lib.uploadedBy}</TableCell>
                    <TableCell className="text-xs">{lib.uploadedAt ? new Date(lib.uploadedAt).toLocaleString() : ''}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {/* Edit display name */}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { setEditingId(lib._id); setEditValue(lib.displayName || lib.fileName); }}
                          title="Edit display name"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        {/* Java Snippet button */}
                        <Button variant="ghost" size="sm" onClick={() => setSnippetLib(lib)} title="Get Java Snippet">
                          <Code className="h-3 w-3 text-primary" />
                        </Button>
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
    </>
  );
}