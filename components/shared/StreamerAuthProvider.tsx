'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface StreamerUser {
  _id: string;
  key: string;
  tiktokUsername: string;
  streamerName: string;
  contact: string;
  status: 'pending' | 'active' | 'inactive' | 'expired';
  liveDuration: number;
  lastLive: string | null;
  lastLiveDuration: number;
  autoExtendEnabled: boolean;
  registrator: string;
  keyExpiry: string | null;
  keyStatus: number;
}

interface StreamerAuthContextType {
  streamer: StreamerUser | null;
  loading: boolean;
  setStreamer: (streamer: StreamerUser | null) => void;
  refreshStreamer: () => Promise<void>;
}

const StreamerAuthContext = createContext<StreamerAuthContextType>({
  streamer: null,
  loading: true,
  setStreamer: () => {},
  refreshStreamer: async () => {},
});

export function useStreamerAuth() {
  return useContext(StreamerAuthContext);
}

export function StreamerAuthProvider({ children }: { children: React.ReactNode }) {
  const [streamer, setStreamer] = useState<StreamerUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStreamer = async () => {
    try {
      const res = await fetch('/api/streamer/auth/me');
      if (res.ok) {
        const data = await res.json();
        setStreamer(data.streamer);
      } else {
        setStreamer(null);
      }
    } catch {
      setStreamer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStreamer();
  }, []);

  return (
    <StreamerAuthContext.Provider value={{ streamer, loading, setStreamer, refreshStreamer }}>
      {children}
    </StreamerAuthContext.Provider>
  );
}
