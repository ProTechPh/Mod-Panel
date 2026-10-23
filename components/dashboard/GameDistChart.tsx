'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Gamepad2 } from 'lucide-react';

interface GameEntry { game: string; count: number; }
interface GameDistChartProps { data: GameEntry[]; }

const BAR_COLORS = ['#ea580c', '#fb923c', '#22c55e', '#fdba74', '#a78bfa', '#eab308', '#a78bfa', '#f87171'];

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
                  <stop offset="0%" stopColor="#7c2d12" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(234, 88, 12, 0.08)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="rgba(234, 88, 12, 0.15)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="game"
                tick={{ fontSize: 11, fill: '#a3aebf' }}
                stroke="rgba(234, 88, 12, 0.15)"
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(234, 88, 12, 0.06)' }}
                contentStyle={{
                  backgroundColor: 'rgba(9, 19, 24, 0.98)',
                  border: '1px solid rgba(234, 88, 12, 0.4)',
                  borderRadius: '10px',
                  fontSize: 12,
                  color: '#f1f5f9',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
                labelStyle={{ color: '#a3aebf', fontFamily: 'var(--ff-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                itemStyle={{ color: '#f1f5f9' }}
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
