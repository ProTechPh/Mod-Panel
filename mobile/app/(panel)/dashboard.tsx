import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import { levelName } from "@/lib/utils";
import { Key, CheckCircle, XCircle, Clock } from "lucide-react-native";
import { KeyTrendsChart } from "@/components/dashboard/KeyTrendsChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { GameDistChart } from "@/components/dashboard/GameDistChart";
import { ActivityChart } from "@/components/dashboard/ActivityChart";

interface AnalyticsData {
  keyStats: { total: number; active: number; expired: number; blocked: number; unused: number };
  keyTrends: { date: string; count: number }[];
  gameDistribution: { game: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  recentActivity: { date: string; created: number; expired: number }[];
}

export default function DashboardScreen() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await api.get("/api/analytics");
      setAnalytics(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), fetchAnalytics()]);
    setRefreshing(false);
  }, [refreshUser, fetchAnalytics]);

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  const stats = analytics?.keyStats;
  const cards = [
    { label: "Total", value: stats?.total ?? 0, icon: Key, color: "#3b82f6" },
    { label: "Active", value: stats?.active ?? 0, icon: CheckCircle, color: "#22c55e" },
    { label: "Expired", value: stats?.expired ?? 0, icon: Clock, color: "#eab308" },
    { label: "Blocked", value: stats?.blocked ?? 0, icon: XCircle, color: "#ef4444" },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />}
    >
      <Text className="text-2xl font-bold text-foreground tracking-tight">Dashboard</Text>
      <Text className="text-muted-foreground text-sm mt-1">
        Welcome back, {user?.fullname || user?.username}
      </Text>

      <View className="flex-row flex-wrap gap-3 mt-6">
        {cards.map((card) => (
          <View
            key={card.label}
            className="bg-card border border-border/50 rounded-xl p-4 flex-1 min-w-[45%]"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider">
                {card.label}
              </Text>
              <card.icon size={16} color={card.color} />
            </View>
            <Text className="text-2xl font-bold text-foreground">{card.value}</Text>
          </View>
        ))}
      </View>

      <View className="mt-4 gap-4">
        <KeyTrendsChart data={analytics?.keyTrends ?? []} />
        <StatusPieChart data={analytics?.statusDistribution ?? []} />
        <ActivityChart data={analytics?.recentActivity ?? []} />
        <GameDistChart data={analytics?.gameDistribution ?? []} />
      </View>

      <View className="bg-card border border-border/50 rounded-xl p-4 mt-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Account Info</Text>
        {[
          { label: "Username", value: user?.username },
          { label: "Level", value: user?.level ? levelName(user.level) : "" },
          { label: "Saldo", value: `$${user?.saldo?.toFixed(2) ?? "0.00"}` },
          { label: "Full Name", value: user?.fullname },
        ].map((item) => (
          <View key={item.label} className="flex-row justify-between py-1.5">
            <Text className="text-sm text-muted-foreground">{item.label}</Text>
            <Text className="text-sm text-foreground font-mono">{item.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}