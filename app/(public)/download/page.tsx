'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';

interface AppLink {
  _id: string;
  appName: string;
  downloadUrl: string;
  isGame?: boolean;
  registrator?: string;
}

const VIRTUAL_APPS = [
  { name: 'ChoRok Virtual V2', url: 'https://www.mediafire.com/file/ruh6p6m36o9hv47/ChoRok_Virtual_V2.apk/file', recommended: true },
  { name: 'ChoRok Virtual', url: 'https://www.mediafire.com/file/v0j99yby45pluo8/ChoRok_Virtual.apk/file' },
  { name: 'GODZ Virtual', url: 'https://www.mediafire.com/file/73jpkuwb9tpjye6/GODZ_VIRTUAL.apk/file' },
  { name: 'GSPACE Virtual', url: 'https://www.mediafire.com/file/4v1miuim8209lio/GSPACE_VIRTUAL.apk/file' },
  { name: 'MIKASA Virtual V2', url: 'https://www.mediafire.com/file/ljfn9bjhmlmbobk/MIKASA_VIRTUAL_V2.apk/file' },
  { name: 'OpsTG Virtual V2', url: 'https://www.mediafire.com/file/l07bj31supspspz/OpsTG_VIRTUAL__%255BV2%255D_OpsTG_%255BV2%255D.apk/file' },
  { name: 'Virtual Mod', url: 'https://www.mediafire.com/file/syxeaxm7om7izs3/VIRTUAL_MOD.apk/file' },
  { name: 'Alexa Virtual (64Bit) - Fixed', url: 'https://www.mediafire.com/file/r9jftm7r8vjujf5/%255BFIXED%255D_Alexa_Virtual_-_64Bit.apk/file' },
];

export default function DownloadPage() {
  const [links, setLinks] = useState<AppLink[]>([]);

  useEffect(() => {
    fetch('/api/download')
      .then(res => res.json())
      .then(setLinks)
      .catch(() => setLinks([]));
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--bg-void)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
          <p style={{ color: 'var(--text-mid)' }}>Available games and apps</p>
        </div>

        {/* Virtual Apps Section */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold">Virtual Apps</h2>
            <p className="text-sm" style={{ color: 'var(--text-mid)' }}>Required virtual space apps for injector</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {VIRTUAL_APPS.map(app => (
              <Card key={app.name} className={`border-border/50 ${app.recommended ? 'ring-2 ring-green-600/50' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      {app.recommended && <Badge className="bg-green-600 hover:bg-green-700 text-white">Recommended</Badge>}
                      <Badge variant="secondary">Virtual</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <a href={app.url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map(link => (
            <Card key={link._id} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{link.appName}</CardTitle>
                  <div className="flex items-center gap-2">
                    {link.isGame && <Badge variant="outline">Game</Badge>}
                    {link.registrator && <span className="text-xs" style={{ color: 'var(--text-lo)' }}>by {link.registrator}</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <a href={link.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
          {links.length === 0 && (
            <p className="col-span-full text-center py-8" style={{ color: 'var(--text-mid)' }}>No download links available</p>
          )}
        </div>
      </div>
    </div>
  );
}
