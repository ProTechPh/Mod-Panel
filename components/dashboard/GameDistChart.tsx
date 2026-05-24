'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Gamepad2 } from 'lucide-react';

interface GameEntry { game: string; count: number; }
interface GameDistChartProps { data: GameEntry[]; }

export default function GameDistChart({ data }: GameDistChartProps) {
  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-purple-400" />
            Keys by Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} layout="vertical">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#e879f9" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} stroke="hsl(var(--border))" />
                <YAxis type="category" dataKey="game" tick={{ fontSize: 12, fill: '#64748b' }} stroke="hsl(var(--border))" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: 12,
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 6, 6, 0]} name="Keys" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
