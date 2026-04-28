'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatusEntry {
  status: string;
  count: number;
}

interface StatusPieChartProps {
  data: StatusEntry[];
}

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#6b7280'];

export default function StatusPieChart({ data }: StatusPieChartProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Key Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 || data.every(d => d.count === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.filter(d => d.count > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="count"
                nameKey="status"
                paddingAngle={2}
              >
                {data.filter(d => d.count > 0).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                  color: '#f1f5f9',
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => <span style={{ color: '#cbd5e1', fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}