'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

interface ActivityPoint { date: string; created: number; expired: number; }
interface ActivityChartProps { data: ActivityPoint[]; }

export default function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="panel panel-corner fade-up d4">
      <div className="panel-head">
        <div className="panel-title">
          <Activity size={16} className="ico" />
          Key Activity (30 Days)
        </div>
        <span className="panel-badge">Live</span>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {data.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-lo)', textAlign: 'center', padding: '3rem 0' }}>
            No data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expiredGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0c040" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f0c040" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 184, 184, 0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#3a6168' }}
                stroke="rgba(20, 184, 184, 0.15)"
                tickFormatter={(v: string) => v.substring(5)}
                tickLine={false}
                axisLine={false}
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
                labelStyle={{ color: '#8ab8be', fontFamily: 'var(--ff-mono)', fontSize: 11 }}
                itemStyle={{ color: '#e8f8f8' }}
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke="#5eead4"
                fill="url(#createdGrad)"
                strokeWidth={2}
                name="Created"
              />
              <Area
                type="monotone"
                dataKey="expired"
                stroke="#f0c040"
                fill="url(#expiredGrad)"
                strokeWidth={2}
                name="Expired"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
