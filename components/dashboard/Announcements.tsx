'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Sparkles } from 'lucide-react';

interface Announcement { _id: string; title: string; content: string; priority: number; createdAt: string; }

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(setAnnouncements)
      .catch(() => {});
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-3">
      {announcements.map(a => (
        <div key={a._id} className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/40 via-fuchsia-500/30 to-cyan-500/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-gradient-to-r from-purple-600/10 via-fuchsia-500/5 to-cyan-500/10 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative shrink-0 mt-0.5">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full blur-md opacity-60 animate-pulse" style={{ animationDuration: '3s' }} />
                  <Megaphone className="relative h-5 w-5 text-purple-300" />
                </div>
                <div className="space-y-1 text-sm flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-purple-200">{a.title}</p>
                    {a.priority > 0 && <Sparkles className="h-3 w-3 text-yellow-400" />}
                  </div>
                  <p className="text-muted-foreground/80 whitespace-pre-wrap">{a.content}</p>
                  <p className="text-xs text-muted-foreground/50">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
