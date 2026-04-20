import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import type { GameSettingItem } from "@/types";
import { Edit3, Plus } from "lucide-react-native";

export default function GameSettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GameSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/game-settings");
      setSettings(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.level <= 2) fetchSettings();
  }, [user, fetchSettings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSettings();
    setRefreshing(false);
  }, [fetchSettings]);

  if (user?.level !== 1 && user?.level !== 2) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Access denied</Text>
      </View>
    );
  }

  const toggleFeature = async (item: GameSettingItem, feature: string) => {
    const newFeatures = { ...item.features, [feature]: !item.features[feature as keyof typeof item.features] };
    try {
      await api.post("/api/game-settings", {
        gameCode: item.gameCode,
        registrator: item.registrator,
        features: newFeatures,
      });
      fetchSettings();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const renderItem = ({ item }: { item: GameSettingItem }) => (
    <View className="bg-card border border-border/50 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-foreground font-semibold">{item.gameName}</Text>
          <Text className="text-xs text-muted-foreground font-mono">{item.gameCode}</Text>
        </View>
        <View
          className={`px-2 py-0.5 rounded ${item.isEnabled ? "bg-green-500/20" : "bg-red-500/20"}`}
        >
          <Text className={`text-xs ${item.isEnabled ? "text-green-400" : "text-red-400"}`}>
            {item.isEnabled ? "Enabled" : "Disabled"}
          </Text>
        </View>
      </View>

      <Text className="text-xs text-muted-foreground mb-2">Registrator: {item.registrator}</Text>

      <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Features</Text>
      <View className="flex-row flex-wrap gap-2">
        {Object.entries(item.features).map(([key, value]) => (
          <Pressable
            key={key}
            onPress={() => toggleFeature(item, key)}
            className={`px-2.5 py-1 rounded-md border ${
              value ? "bg-green-500/10 border-green-500/30" : "bg-muted border-border"
            }`}
          >
            <Text className={`text-xs ${value ? "text-green-400" : "text-muted-foreground"}`}>
              {key}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row gap-2 mt-2">
        <View className="flex-row items-center gap-1.5">
          <View className={`w-2 h-2 rounded-full ${item.connectEnabled ? "bg-green-400" : "bg-red-400"}`} />
          <Text className="text-xs text-muted-foreground">Connect</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className={`w-2 h-2 rounded-full ${item.freeKeyEnabled ? "bg-green-400" : "bg-red-400"}`} />
          <Text className="text-xs text-muted-foreground">Free Key</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-foreground tracking-tight mb-4">
          Game Settings
        </Text>
      </View>
      <FlatList
        data={settings}
        keyExtractor={(item) => `${item.gameCode}-${item.registrator}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted-foreground">{loading ? "Loading..." : "No game settings"}</Text>
          </View>
        }
      />
    </View>
  );
}