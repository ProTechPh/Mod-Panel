import { View, Text, TextInput, Pressable, FlatList, RefreshControl } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/context";
import { formatDuration, cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { KeyItem } from "@/types";
import { Plus, Search, Trash2, RotateCcw, Edit3 } from "lucide-react-native";

export default function KeysScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchKeys = useCallback(async (searchVal = "") => {
    setLoading(true);
    try {
      const searchParam = encodeURIComponent(searchVal);
      const data = await api.get(`/api/keys?draw=1&start=0&length=100&search%5Bvalue%5D=${searchParam}`);
      setKeys(data.data || []);
    } catch (e: any) {
      toast.error("Error", e.message || "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchKeys(search);
    setRefreshing(false);
  }, [fetchKeys, search]);

  const handleDelete = (id: string) => {
    toast.confirm("Delete Key", "Are you sure?", async () => {
      try {
        await api.delete(`/api/keys/${id}`);
        fetchKeys(search);
      } catch (e: any) {
        toast.error("Error", e.message);
      }
    });
  };

  const handleReset = async (id: string) => {
    try {
      await api.get(`/api/keys/reset?id=${id}`);
      toast.success("Reset", "Devices reset");
      fetchKeys(search);
    } catch (e: any) {
      toast.error("Error", e.message);
    }
  };

  if (user?.level !== 1 && user?.level !== 2) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Access denied</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: KeyItem }) => (
    <View className="bg-card border border-border/50 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="font-mono text-xs text-foreground bg-muted px-2 py-0.5 rounded">
            {item.game}
          </Text>
          <View
            className={cn(
              "px-2 py-0.5 rounded",
              item.status === 1 ? "bg-green-500/20" : "bg-red-500/20"
            )}
          >
            <Text
              className={cn(
                "text-xs font-medium",
                item.status === 1 ? "text-green-400" : "text-red-400"
              )}
            >
              {item.status === 1 ? "Active" : "Blocked"}
            </Text>
          </View>
        </View>
        <Text className="text-xs text-muted-foreground font-mono">{item.registrator}</Text>
      </View>

      <Text className="font-mono text-xs text-foreground mb-1">{item.userKey}</Text>

      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-row gap-3">
          <Text className="text-xs text-muted-foreground">
            Duration: {formatDuration(item.duration)}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Devices: {item.devices?.length ?? 0}/{item.maxDevices}
          </Text>
        </View>
      </View>

      {item.expiredDate && (
        <Text className="text-xs text-muted-foreground mt-1">
          Expires: {new Date(item.expiredDate).toLocaleDateString()}
        </Text>
      )}

      <View className="flex-row gap-2 mt-3 justify-end">
        <Pressable
          onPress={() => router.replace(`/keys/${item._id}`)}
          className="bg-muted px-3 py-1.5 rounded-md"
        >
          <Edit3 size={14} color="#a1a1aa" />
        </Pressable>
        <Pressable
          onPress={() => handleReset(item._id)}
          className="bg-muted px-3 py-1.5 rounded-md"
        >
          <RotateCcw size={14} color="#a1a1aa" />
        </Pressable>
        <Pressable
          onPress={() => handleDelete(item._id)}
          className="bg-red-500/20 px-3 py-1.5 rounded-md"
        >
          <Trash2 size={14} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground tracking-tight">Keys</Text>
          <Pressable
            onPress={() => router.replace("/keys/generate")}
            className="bg-primary px-4 py-2 rounded-lg flex-row items-center gap-2"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-primary-foreground text-sm font-medium">Generate</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2 mb-4">
          <TextInput
            className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 text-foreground text-sm"
            placeholder="Search keys..."
            placeholderTextColor="#71717a"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchKeys(search)}
            returnKeyType="search"
          />
          <Pressable
            onPress={() => fetchKeys(search)}
            className="bg-card border border-border rounded-lg px-3 items-center justify-center"
          >
            <Search size={18} color="#a1a1aa" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={keys}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted-foreground">
              {loading ? "Loading..." : "No keys found"}
            </Text>
          </View>
        }
      />
    </View>
  );
}