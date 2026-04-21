import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/utils";
import { levelName } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { HistoryEntry } from "@/types";
import { Trash2 } from "lucide-react-native";

export default function HistoryScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await api.get("/api/history");
      setHistory(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error("Error", e.message);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  const handleClear = () => {
    toast.confirm("Clear History", "Clear all your history?", async () => {
      await api.delete("/api/history");
      toast.success("Cleared", "History cleared");
      fetchHistory();
    });
  };

  const handleClearAll = () => {
    toast.confirm("Clear ALL History", "This cannot be undone.", async () => {
      await api.delete("/api/history?all=true");
      toast.success("Cleared", "All history cleared");
      fetchHistory();
    });
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <View className="bg-card border border-border/50 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm text-foreground font-medium">{item.userDo}</Text>
        <Text className="text-xs text-muted-foreground">
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
        </Text>
      </View>
      <Text className="font-mono text-xs text-muted-foreground">{item.info}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4 flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-foreground tracking-tight">History</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={handleClear}
            className="bg-card border border-border px-3 py-2 rounded-lg flex-row items-center gap-1.5"
          >
            <Trash2 size={14} color="#a1a1aa" />
            <Text className="text-muted-foreground text-xs font-medium">Clear Mine</Text>
          </Pressable>
          {user?.level === 1 && (
            <Pressable
              onPress={handleClearAll}
              className="bg-destructive/20 px-3 py-2 rounded-lg flex-row items-center gap-1.5"
            >
              <Trash2 size={14} color="#ef4444" />
              <Text className="text-destructive text-xs font-medium">Clear All</Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted-foreground">No history</Text>
          </View>
        }
      />
    </View>
  );
}