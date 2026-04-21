import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useState, useCallback, useEffect } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import { API_URL } from "@/lib/constants";
import { useToast } from "@/components/Toast";
import type { LibDoc } from "@/types";
import { Trash2, Upload, Link } from "lucide-react-native";

export default function LibScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [libs, setLibs] = useState<LibDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchLibs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/libs");
      setLibs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error("Error", e.message);
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

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const file = result.assets[0];
    if (!file.name?.endsWith(".so")) {
      toast.error("Invalid File", "Only .so files are allowed");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/octet-stream",
    } as any);

    try {
      await api.upload("/api/libs", formData);
      toast.success("Uploaded", "File uploaded successfully");
      fetchLibs();
    } catch (e: any) {
      toast.error("Upload Failed", e.message === "RETRY" ? "Upload failed" : (e.message || "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = async (fileName: string) => {
    await Clipboard.setStringAsync(`${API_URL}/api/libs/serve/${fileName}`);
    toast.info("Copied", "Download link copied to clipboard");
  };

  const handleDelete = (item: LibDoc) => {
    toast.confirm("Delete File", `Delete ${item.fileName}?`, async () => {
      try {
        await api.delete(`/api/libs?id=${item._id}`);
        toast.success("Deleted", "File deleted successfully");
        fetchLibs();
      } catch (e: any) {
        toast.error("Error", e.message);
      }
    });
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
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleCopyLink(item.fileName)}
            className="bg-muted px-3 py-1.5 rounded-md"
          >
            <Link size={14} color="#a1a1aa" />
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            className="bg-red-500/20 px-3 py-1.5 rounded-md"
          >
            <Trash2 size={14} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-4 mb-4">
        <Text className="text-2xl font-bold text-foreground tracking-tight">Library</Text>
        <Pressable
          onPress={handleUpload}
          disabled={uploading}
          className={`flex-row items-center border border-border rounded-md px-3 py-1.5 ${uploading ? "opacity-50" : ""}`}
        >
          <Upload size={14} color="#a1a1aa" />
          <Text className="text-foreground text-sm ml-2">
            {uploading ? "Uploading..." : "Upload .so"}
          </Text>
        </Pressable>
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