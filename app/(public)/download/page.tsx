'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun } from 'lucide-react';

interface AppLink {
  _id: string;
  appName: string;
  downloadUrl: string;
  isGame?: boolean;
  registrator?: string;
}

export default function DownloadPage() {
  const { theme, toggleTheme } = useTheme();
  const [links, setLinks] = useState<AppLink[]>([]);

  useEffect(() => {
    fetch('/api/download')
      .then(res => res.json())
      .then(setLinks)
      .catch(() => setLinks([]));
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
          <p className="text-muted-foreground">Available games and apps</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map(link => (
            <Card key={link._id} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{link.appName}</CardTitle>
                  <div className="flex items-center gap-2">
                    {link.isGame && <Badge variant="outline">Game</Badge>}
                    {link.registrator && <span className="text-xs text-muted-foreground">by {link.registrator}</span>}
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
            <p className="text-muted-foreground col-span-full text-center py-8">No download links available</p>
          )}
        </div>
      </div>
    </div>
  );
}