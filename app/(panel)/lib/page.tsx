'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { Upload, Trash2, Download, Link as LinkIcon, Code, X, Copy, Check, Pencil, Save, History, Library, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface Lib {
  _id: string;
  fileName: string;
  displayName: string;
  type: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface LibLog {
  _id: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  downloadedAt: string;
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
    void navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2, 6, 8, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(234, 88, 12, 0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
            <span className="font-display font-bold text-sm" style={{ color: 'var(--text-hi)' }}>Java Snippet</span>
            <span className="key-chip">{lib.fileName}</span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="px-5 pt-4 pb-2 space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-mid)' }}>
            Dynamic na kino-fetch ng <code style={{ background: 'rgba(234, 88, 12, 0.1)', padding: '0.1rem 0.35rem', borderRadius: 4, color: 'var(--teal-3)' }}>MainActivity</code> ang libs mula sa <code style={{ background: 'rgba(234, 88, 12, 0.1)', padding: '0.1rem 0.35rem', borderRadius: 4, color: 'var(--teal-3)' }}>/api/libs/list?uploadedBy=WINTER</code>.
          </p>
          <div
            className="rounded-lg px-3 py-2.5 space-y-1"
            style={{ background: 'rgba(2, 6, 8, 0.4)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-mid)' }}>
              <span className="font-medium" style={{ color: 'var(--text-hi)' }}>Display name:</span> {lib.displayName}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-mid)' }}>
              <span className="font-medium" style={{ color: 'var(--text-hi)' }}>File name:</span> {lib.fileName}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-mid)' }}>
              <span className="font-medium" style={{ color: 'var(--text-hi)' }}>Uploaded by:</span> {lib.uploadedBy}
            </p>
          </div>
        </div>

        <div className="relative mx-5 mb-5">
          <pre
            className="overflow-x-auto rounded-lg p-4 text-xs font-mono max-h-72"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border)',
              color: 'var(--ecto-green)',
              fontFamily: 'var(--ff-mono)',
            }}
          >
            {snippet}
          </pre>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="absolute top-2 right-2"
          >
            {copied ? <Check className="h-3 w-3" style={{ color: 'var(--ecto-green)' }} /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LogsModal({ lib, onClose }: { lib: Lib; onClose: () => void }) {
  const [logs, setLogs] = useState<LibLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch(`/api/libs/logs?libId=${lib._id}`);
        const d = await r.json();
        if (!cancelled) {
          setLogs(Array.isArray(d) ? d : []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lib._id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2, 6, 8, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(234, 88, 12, 0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
            <span className="font-display font-bold text-sm" style={{ color: 'var(--text-hi)' }}>Download Logs</span>
            <span className="key-chip">{lib.fileName}</span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
              <span className="inline-block size-2 rounded-full animate-pulse" style={{ background: 'var(--teal-2)' }} />
              Loading logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-ring"><History size={26} /></div>
              <div className="empty-title">No Logs Yet</div>
              <div className="empty-sub">Download activity will appear here once users fetch the file.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div
                  key={log._id}
                  className="rounded-lg px-4 py-3 text-xs space-y-1.5"
                  style={{ border: '1px solid var(--border)', background: 'rgba(234, 88, 12, 0.04)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono" style={{ color: 'var(--text-hi)' }}>{log.ipAddress}</span>
                    <span className="font-mono" style={{ color: 'var(--text-lo)' }}>{new Date(log.downloadedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded font-medium"
                      style={{ background: 'rgba(234, 88, 12, 0.1)', color: 'var(--teal-3)', padding: '0.1rem 0.5rem', fontSize: '0.65rem' }}
                    >
                      {log.device || 'Unknown'}
                    </span>
                    <span className="truncate" style={{ color: 'var(--text-mid)' }}>{log.userAgent}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  const [uploadType, setUploadType] = useState<'free' | 'paid'>('free');
  const [snippetLib, setSnippetLib] = useState<Lib | null>(null);
  const [logsLib, setLogsLib] = useState<Lib | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState<'free' | 'paid'>('free');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/libs');
        const data = await res.json();
        setLibs(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Failed to load libraries');
      }
    })();
  }, []);

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
        formData.append('type', uploadType);

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
      const r = await fetch('/api/libs');
      const d = await r.json();
      setLibs(Array.isArray(d) ? d : []);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async (id: string, displayName: string, type?: string) => {
    try {
      const body: Record<string, string> = { id, displayName };
      if (type) body.type = type;
      const res = await fetch('/api/libs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { toast.error('Update failed'); return; }
      toast.success('Library updated');
      setEditingId(null);
      const r = await fetch('/api/libs');
      const d = await r.json();
      setLibs(Array.isArray(d) ? d : []);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    const res = await fetch(`/api/libs?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('File deleted');
      const r = await fetch('/api/libs');
      const d = await r.json();
      setLibs(Array.isArray(d) ? d : []);
    } else {
      toast.error('Delete failed');
    }
  };

  return (
    <>
      {snippetLib && <SnippetModal lib={snippetLib} onClose={() => setSnippetLib(null)} />}
      {logsLib && <LogsModal lib={logsLib} onClose={() => setLogsLib(null)} />}

      <div className="space-y-4">
        <PageHeader
          eyebrow="Library / Binaries"
          title="LIB"
          highlight="ARCHIVE"
          sub="Upload, version, and distribute game binaries and mod libraries."
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr] items-start">
          {/* Left Column: Upload Payload Console */}
          <div className="space-y-4 fade-up d1">
            <div className="panel">
              <div className="panel-head">
                <h2 className="panel-title">
                  <Upload size={14} className="text-orange-500" />
                  <span>Payload Uploader</span>
                </h2>
                <span className="panel-badge">CDN LINK</span>
              </div>

              <div className="p-5 space-y-4 font-sans text-xs">
                {/* Type Selection Tiles */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block">Clearance Access Type</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadType('free')}
                      className={`tab-btn ${uploadType === 'free' ? 'active' : ''}`}
                    >
                      FREE
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadType('paid')}
                      className={`tab-btn ${uploadType === 'paid' ? 'active' : ''}`}
                    >
                      PAID
                    </button>
                  </div>
                </div>

                {/* Drag Drop zone styled file selector */}
                <div className="rounded-lg border-2 border-dashed border-white/10 bg-black/20 hover:bg-black/35 hover:border-orange-500/30 p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer">
                  <input type="file" accept=".so" onChange={handleUpload} disabled={uploading} ref={fileInputRef} className="hidden" id="lib-upload-grid" />
                  <label htmlFor="lib-upload-grid" className="w-full cursor-pointer flex flex-col items-center gap-2">
                    <FileCode size={28} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-white uppercase tracking-wider text-[11px]">Choose DLL Payload (.so)</span>
                      <span className="text-[9px] text-[var(--text-lo)] font-mono uppercase tracking-widest">// Maximum Size: 50MB</span>
                    </div>
                  </label>
                </div>

                {/* Dynamic Upload Progress */}
                {uploading && (
                  <div
                    className="space-y-2 rounded-lg p-4 border border-orange-500/20 bg-orange-500/5 animate-pulse"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono truncate max-w-[180px] text-slate-300">{uploadFileName}</span>
                      <span className="font-bold text-orange-500 tabular-nums">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                    <p className="font-mono text-[9px] text-[var(--text-lo)] uppercase tracking-wider">
                      {uploadProgress < 95 ? '// uploading chunks…' : uploadProgress < 100 ? '// finalizing upload…' : '// done'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Binary CDN Log */}
          <Card className="fade-up d2 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {libs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Library className="h-6 w-6 mx-auto mb-2 opacity-40" />
                        <div className="font-mono text-xs uppercase tracking-widest">No libraries in archive</div>
                      </TableCell>
                    </TableRow>
                  ) : libs.map(lib => (
                    <TableRow key={lib._id}>
                      <TableCell>
                        {editingId === lib._id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="h-7 w-40 rounded border bg-transparent px-2 text-xs font-mono outline-none"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-hi)' }}
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') void handleUpdate(lib._id, editValue, editType);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <select
                              value={editType}
                              onChange={e => setEditType(e.target.value as 'free' | 'paid')}
                              className="h-7 rounded border bg-transparent px-1 text-xs outline-none font-mono"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-hi)' }}
                            >
                              <option value="free">FREE</option>
                              <option value="paid">PAID</option>
                            </select>
                            <Button variant="ghost" size="icon-sm" onClick={() => void handleUpdate(lib._id, editValue, editType)}>
                              <Save className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FileCode className="h-3.5 w-3.5" style={{ color: 'var(--teal-2)' }} />
                            <span className="font-mono">{lib.displayName || lib.fileName}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {lib.type === 'paid'
                          ? <StatusBadge status="warning">Paid</StatusBadge>
                          : <StatusBadge status="success">Free</StatusBadge>}
                      </TableCell>
                      <TableCell className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>{lib.fileSize}</TableCell>
                      <TableCell className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>{lib.uploadedBy}</TableCell>
                      <TableCell className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                        {lib.uploadedAt ? new Date(lib.uploadedAt).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon-sm" onClick={() => setLogsLib(lib)} title="Download Logs">
                            <History className="h-3.5 w-3.5" style={{ color: 'var(--text-mid)' }} />
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm"
                            onClick={() => { setEditingId(lib._id); setEditValue(lib.displayName || lib.fileName); setEditType((lib.type || 'free') as 'free' | 'paid'); }}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--text-mid)' }} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setSnippetLib(lib)} title="Get Java Snippet">
                            <Code className="h-3.5 w-3.5" style={{ color: 'var(--teal-2)' }} />
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm"
                            onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/api/libs/serve/${lib.fileName}`); toast.success('Link copied'); }}
                            title="Copy link"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                          </Button>
                          <a href={`/api/libs/serve/${lib.fileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon-sm" title="Download">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="icon-sm" onClick={() => void handleDelete(lib._id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--red)' }} />
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
      </div>
    </>
  );
}
