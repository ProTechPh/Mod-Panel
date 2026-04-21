import { View, Text, TextInput, Pressable, Switch, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { ServerConfig } from "@/types";

export default function ServerScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/api/server-config")
      .then((data) => setConfig(data))
      .catch(() => toast.error("Error", "Failed to load config"))
      .finally(() => setLoading(false));
  }, []);

  if (user?.level !== 1) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Access denied</Text>
      </View>
    );
  }

  if (loading || !config) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/server-config", config);
      toast.success("Saved", "Config saved successfully");
    } catch (e: any) {
      toast.error("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-foreground tracking-tight">Server Config</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-primary-foreground text-sm font-medium">
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </View>

      <View className="bg-card border border-border/50 rounded-xl p-4 gap-4">
        <Text className="text-lg font-semibold text-foreground">Maintenance</Text>
        <View className="flex-row items-center gap-3">
          <Switch
            value={config.maintenanceStatus === "on"}
            onValueChange={(v) =>
              setConfig({ ...config, maintenanceStatus: v ? "on" : "off" })
            }
            trackColor={{ false: "#27272a", true: "#a855f7" }}
            thumbColor="#fff"
          />
          <Text className="text-sm text-foreground">Maintenance Mode</Text>
        </View>
        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Maintenance Message</Text>
          <TextInput
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
            value={config.maintenanceMessage}
            onChangeText={(v) => setConfig({ ...config, maintenanceMessage: v })}
            multiline
            numberOfLines={3}
            placeholder="Enter maintenance message..."
            placeholderTextColor="#71717a"
          />
        </View>
      </View>
    </ScrollView>
  );
}