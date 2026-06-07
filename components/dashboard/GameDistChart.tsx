'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Gamepad2 } from 'lucide-react';

interface GameEntry { game: string; count: number; }
interface GameDistChartProps { data: GameEntry[]; }

const BAR_COLORS = ['#14b8b8', '#5eead4', '#39ff14', '#00fff7', '#a78bfa', '#f0c040', '#60a5fa', '#f87171'];

export default function GameDistChart({ data }: GameDistChartProps) {
  return (
    <div className="panel panel-corner fade-up d4">
      <div className="panel-head">
        <div className="panel-title">
          <Gamepad2 size={16} className="ico" />
          Keys by Game
        </div>
        <span className="panel-badge">{data.length} games</span>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {data.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-lo)', textAlign: 'center', padding: '3rem 0' }}>
            No data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, data.length * 38)}>
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0d7a7a" />
                  <stop offset="100%" stopColor="#5eead4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 184, 184, 0.08)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#3a6168' }}
                stroke="rgba(20, 184, 184, 0.15)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="game"
                tick={{ fontSize: 11, fill: '#8ab8be' }}
                stroke="rgba(20, 184, 184, 0.15)"
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(20, 184, 184, 0.06)' }}
                contentStyle={{
                  backgroundColor: 'rgba(9, 19, 24, 0.98)',
                  border: '1px solid rgba(20, 184, 184, 0.4)',
                  borderRadius: '10px',
                  fontSize: 12,
                  color: '#e8f8f8',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
                labelStyle={{ color: '#8ab8be', fontFamily: 'var(--ff-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                itemStyle={{ color: '#e8f8f8' }}
              />
              <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 6, 6, 0]} name="Keys">
                {data.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
