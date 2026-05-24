'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart } from 'recharts';
import { MousePointerClick, TrendingUp, Eye, Clock, Users, BarChart3, Zap, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AdClaimTrend {
  date: string;
  claims: number;
  extensions: number;
}

interface GameAdStats {
  game: string;
  totalAdClaims: number;
  totalExtensions: number;
  activeKeys: number;
}

interface TopAdSupporter {
  maskedIp: string;
  totalClaims: number;
  threeHourClaims: number;
  extensions: number;
  lastClaim: string;
}

interface TopAdPerformer {
  registrator: string;
  totalKeys: number;
  activeKeys: number;
  adClaims: number;
  extensions: number;
  revenueEstimate: number;
  lastActivity: string;
}

interface DailyRevenue {
  date: string;
  adImpressions: number;
  uniqueIps: number;
}

interface AdsAnalytics {
  totalAdClaims: number;
  total3hClaims: number;
  totalExtensions: number;
  total3hActive: number;
  adClaimTrends: AdClaimTrend[];
  gameAdStats: GameAdStats[];
  topSupporters: TopAdSupporter[];
  topPerformers: TopAdPerformer[];
  dailyRevenue: DailyRevenue[];
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  fontSize: 12,
  color: '#f1f5f9',
};

const labelStyle = { color: '#94a3b8' };
const itemStyle = { color: '#f1f5f9' };

export default function AdsAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AdsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/ads-analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnalytics(data.data);
        } else {
          toast.error('Failed to load ads analytics');
        }
      })
      .catch(() => toast.error('Failed to load ads analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.level !== 1) {
    return <p className="text-muted-foreground">Access denied</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const statsCards = [
    { label: 'Total Ad Claims', value: analytics.totalAdClaims, icon: MousePointerClick, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '3h Key Claims', value: analytics.total3hClaims, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Key Extensions', value: analytics.totalExtensions, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active 3h Keys', value: analytics.total3hActive, icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },

  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Ads Analytics</h2>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statsCards.map(card => (
          <div key={card.label} className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Ad Claim Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Ad Claim Trends
                <span className="ml-auto text-xs text-muted-foreground font-normal">Last 30 days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.adClaimTrends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analytics.adClaimTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#cbd5e1' }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v: string) => v.substring(5)}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                    <Legend />
                    <Area type="monotone" dataKey="claims" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="3h Claims" />
                    <Area type="monotone" dataKey="extensions" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Extensions" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Unique Users & Impressions */}
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                Daily Impressions & Unique IPs
                <span className="ml-auto text-xs text-muted-foreground font-normal">Last 30 days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.dailyRevenue.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={analytics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#cbd5e1' }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v: string) => v.substring(5)}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="adImpressions" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Ad Impressions" />
                    <Line type="monotone" dataKey="uniqueIps" stroke="#06b6d4" strokeWidth={2} dot={false} name="Unique IPs" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Ad Stats */}
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Ad Performance by Game
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.gameAdStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.gameAdStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#cbd5e1' }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="game" tick={{ fontSize: 12, fill: '#cbd5e1' }} stroke="hsl(var(--muted-foreground))" width={80} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                      <Legend />
                      <Bar dataKey="totalAdClaims" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Ad Claims" />
                      <Bar dataKey="totalExtensions" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Extensions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead className="text-right">Claims</TableHead>
                        <TableHead className="text-right">Extensions</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.gameAdStats.map((stat) => (
                        <TableRow key={stat.game}>
                          <TableCell className="font-medium">{stat.game}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{stat.totalAdClaims}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{stat.totalExtensions}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/30">{stat.activeKeys}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Ad Performers */}
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              Top Ad Performers
              <span className="ml-auto text-xs text-muted-foreground font-normal">by total free keys generated</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPerformers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Total Keys</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Ad Claims</TableHead>
                    <TableHead className="text-right">Extensions</TableHead>
                    <TableHead className="text-right">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topPerformers.map((performer, idx) => (
                    <TableRow key={performer.registrator}>
                      <TableCell>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{performer.registrator}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{performer.totalKeys}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/30">{performer.activeKeys}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">{performer.adClaims}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30">{performer.extensions}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(performer.lastActivity).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Ad Supporters */}
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-400" />
              Top Ad Supporters
              <span className="ml-auto text-xs text-muted-foreground font-normal">by total ad interactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topSupporters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Total Claims</TableHead>
                    <TableHead className="text-right">3h Claims</TableHead>
                    <TableHead className="text-right">Extensions</TableHead>
                    <TableHead className="text-right">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topSupporters.map((supporter, idx) => (
                    <TableRow key={supporter.maskedIp}>
                      <TableCell>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{supporter.maskedIp}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{supporter.totalClaims}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">{supporter.threeHourClaims}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30">{supporter.extensions}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(supporter.lastClaim).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}