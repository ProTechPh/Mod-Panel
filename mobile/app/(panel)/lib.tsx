import { View, Text, FlatList, Pressable, Alert, RefreshControl } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import type { LibDoc } from "@/types";
import { Trash2, Upload } from "lucide-react-native";

export default function LibScreen() {
  const { user } = useAuth();
  const [libs, setLibs] = useState<LibDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLibs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/libs");
      setLibs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.level <= 2) fetchLibs();
  }, [user, fetchLibs]);

  if (user?.level !== 1 && user?.level !== 2) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Access denied</Text>
      </View>
    );
  }

  const handleDelete = async (fileName: string) => {
    Alert.alert("Delete File", `Delete ${fileName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/libs?fileName=${fileName}`);
            Alert.alert("Success", "File deleted");
            fetchLibs();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: LibDoc }) => (
    <View className="bg-card border border-border/50 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{item.displayName || item.fileName}</Text>
          <Text className="text-xs text-muted-foreground font-mono mt-1">{item.fileName}</Text>
          <View className="flex-row gap-3 mt-1">
            {item.fileSize && (
              <Text className="text-xs text-muted-foreground">{item.fileSize}</Text>
            )}
            <Text className="text-xs text-muted-foreground">
              By: {item.uploadedBy}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => handleDelete(item.fileName)}
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
        <Text className="text-2xl font-bold text-foreground tracking-tight mb-4">Library</Text>
      </View>
      <FlatList
        data={libs}
        keyExtractor={(item) => item.fileName}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchLibs} tintColor="#a855f7" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted-foreground">{loading ? "Loading..." : "No files"}</Text>
          </View>
        }
      />
    </View>
  );
}