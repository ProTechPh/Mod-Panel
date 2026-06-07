'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface StatusEntry { status: string; count: number; }
interface StatusPieChartProps { data: StatusEntry[]; }

const COLORS = {
  active: '#39ff14',
  expired: '#f0c040',
  blocked: '#ef4444',
  unused: '#6b7280',
};

export default function StatusPieChart({ data }: StatusPieChartProps) {
  const filtered = data.filter(d => d.count > 0);

  return (
    <div className="panel panel-corner fade-up d3">
      <div className="panel-head">
        <div className="panel-title">
          <PieChartIcon size={16} className="ico" />
          Key Status Distribution
        </div>
        <span className="panel-badge">{filtered.length} types</span>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-lo)', textAlign: 'center', padding: '3rem 0' }}>
            No data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={filtered}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                dataKey="count"
                nameKey="status"
                paddingAngle={2}
                stroke="rgba(2, 6, 8, 0.6)"
                strokeWidth={2}
              >
                {filtered.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={COLORS[entry.status as keyof typeof COLORS] || '#6b7280'}
                    style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                  />
                ))}
              </Pie>
              <Tooltip
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
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span
                    style={{
                      color: 'var(--text-mid)',
                      fontSize: 11,
                      fontFamily: 'var(--ff-mono)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
