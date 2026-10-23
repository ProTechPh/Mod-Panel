'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, PackageOpen } from 'lucide-react';

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
      .then((res) => res.json())
      .then(setLinks)
      .catch(() => setLinks([]));
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-2 text-center">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--brand-400)]">
            [ CLIENT DISTRIBUTION ]
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Downloads<span className="highlight">/all</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Available games and companion apps for the injector.
          </p>
        </header>

        <section className="space-y-4" aria-labelledby="virtual-apps">
          <div className="space-y-1">
            <h2 id="virtual-apps" className="text-lg font-semibold">
              Virtual Apps
            </h2>
            <p className="text-sm text-muted-foreground">Required virtual space apps for injector.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VIRTUAL_APPS.map((app) => (
              <Card key={app.name} className="flex flex-col">
                <CardHeader className="gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{app.name}</CardTitle>
                    {app.recommended && <Badge variant="success">Recommended</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ size: 'sm', className: 'w-full' })}
                  >
                    <Download aria-hidden />
                    Download
                    <span className="sr-only"> {app.name}</span>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="game-builds">
          <div className="space-y-1">
            <h2 id="game-builds" className="text-lg font-semibold">
              Game Builds
            </h2>
            <p className="text-sm text-muted-foreground">Published by verified registrators.</p>
          </div>

          {links.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-ring">
                <PackageOpen aria-hidden className="size-5" />
              </div>
              <p className="empty-title">No download links available</p>
              <p className="empty-sub">Published game builds will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <Card key={link._id} className="flex flex-col">
                  <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{link.appName}</CardTitle>
                      {link.isGame && <Badge variant="outline">Game</Badge>}
                    </div>
                    {link.registrator && (
                      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        by {link.registrator}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <a
                      href={link.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ size: 'sm', className: 'w-full' })}
                    >
                      <Download aria-hidden />
                      Download
                      <span className="sr-only"> {link.appName}</span>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
