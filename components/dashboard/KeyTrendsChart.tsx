'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendPoint { date: string; count: number; }
interface KeyTrendsChartProps { data: TrendPoint[]; }

export default function KeyTrendsChart({ data }: KeyTrendsChartProps) {
  return (
    <div className="panel panel-corner fade-up d3">
      <div className="panel-head">
        <div className="panel-title">
          <TrendingUp size={16} className="ico" />
          Key Creation Trends
        </div>
        <span className="panel-badge">30 days</span>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {data.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-lo)', textAlign: 'center', padding: '3rem 0' }}>
            No data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14b8b8" />
                  <stop offset="100%" stopColor="#5eead4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 184, 184, 0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#3a6168' }}
                stroke="rgba(20, 184, 184, 0.15)"
                tickFormatter={(v: string) => v.substring(5)}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#3a6168' }}
                stroke="rgba(20, 184, 184, 0.15)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ stroke: 'var(--teal-2)', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'rgba(9, 19, 24, 0.98)',
                  border: '1px solid rgba(20, 184, 184, 0.4)',
                  borderRadius: '10px',
                  fontSize: 12,
                  color: '#e8f8f8',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
                labelStyle={{ color: '#8ab8be', fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '0.08em' }}
                itemStyle={{ color: '#e8f8f8' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="url(#lineGrad)"
                strokeWidth={2.5}
                dot={{ fill: '#14b8b8', strokeWidth: 0, r: 3 }}
                activeDot={{ fill: '#5eead4', strokeWidth: 0, r: 5, style: { filter: 'drop-shadow(0 0 6px #5eead4)' } }}
                name="Keys Created"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
