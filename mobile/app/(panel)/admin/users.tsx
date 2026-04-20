import { View, Text, TextInput, FlatList, Pressable, Alert, RefreshControl } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import { levelName, cn } from "@/lib/utils";
import type { UserItem } from "@/types";
import { Search, Edit3, Trash2 } from "lucide-react-native";

export default function UsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async (searchVal = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        draw: "1",
        start: "0",
        length: "100",
        "search[value]": searchVal,
      });
      const data = await api.get(`/api/users?${params.toString()}`);
      setUsers(data.data || []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.level === 1) fetchUsers();
  }, [user, fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers(search);
    setRefreshing(false);
  }, [fetchUsers, search]);

  if (user?.level !== 1) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Access denied</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: UserItem }) => (
    <View className="bg-card border border-border/50 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-semibold">{item.username}</Text>
        <View
          className={cn(
            "px-2 py-0.5 rounded",
            item.status === 1
              ? "bg-green-500/20"
              : item.status === 2
                ? "bg-red-500/20"
                : "bg-yellow-500/20"
          )}
        >
          <Text
            className={cn(
              "text-xs font-medium",
              item.status === 1
                ? "text-green-400"
                : item.status === 2
                  ? "text-red-400"
                  : "text-yellow-400"
            )}
          >
            {item.status === 1 ? "Active" : item.status === 2 ? "Banned" : "Expired"}
          </Text>
        </View>
      </View>
      <View className="gap-0.5">
        <Text className="text-xs text-muted-foreground">Email: {item.email}</Text>
        <Text className="text-xs text-muted-foreground">Level: {levelName(item.level)}</Text>
        <Text className="text-xs text-muted-foreground">Saldo: ${item.saldo?.toFixed(2)}</Text>
      </View>
      <View className="flex-row gap-2 mt-2 justify-end">
        <Pressable
          onPress={() => router.replace(`/admin/users/${item._id}`)}
          className="bg-muted px-3 py-1.5 rounded-md"
        >
          <Edit3 size={14} color="#a1a1aa" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-foreground tracking-tight mb-4">Users</Text>
        <View className="flex-row gap-2 mb-4">
          <TextInput
            className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 text-foreground text-sm"
            placeholder="Search users..."
            placeholderTextColor="#71717a"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchUsers(search)}
            returnKeyType="search"
          />
          <Pressable
            onPress={() => fetchUsers(search)}
            className="bg-card border border-border rounded-lg px-3 items-center justify-center"
          >
            <Search size={18} color="#a1a1aa" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted-foreground">{loading ? "Loading..." : "No users found"}</Text>
          </View>
        }
      />
    </View>
  );
}