'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: number;
  createdAt: string;
}

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
        <Card key={a._id} className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Megaphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{a.title}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
