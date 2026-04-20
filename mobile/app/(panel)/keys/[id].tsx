import { View, Text, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { formatDuration, cn } from "@/lib/utils";
import type { KeyItem } from "@/types";

export default function KeyEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [key, setKey] = useState<KeyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<number>(0);
  const [game, setGame] = useState("");
  const [maxDevices, setMaxDevices] = useState("1");

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/keys/${id}`)
      .then((data) => {
        setKey(data);
        setStatus(data.status);
        setGame(data.game);
        setMaxDevices(String(data.maxDevices));
      })
      .catch((e: any) => Alert.alert("Error", e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.put(`/api/keys/${id}`, {
        game,
        maxDevices: Number(maxDevices),
        status,
      });
      Alert.alert("Success", "Key updated", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  if (!key) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Key not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: "Edit Key" }} />

      <View className="bg-card border border-border/50 rounded-xl p-4 gap-4">
        <View>
          <Text className="text-sm text-muted-foreground mb-1">Key</Text>
          <Text className="text-foreground font-mono text-xs">{key.userKey}</Text>
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Game</Text>
          <TextInput
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
            value={game}
            onChangeText={setGame}
          />
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1">Duration</Text>
          <Text className="text-foreground text-sm">{formatDuration(key.duration)}</Text>
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Max Devices</Text>
          <TextInput
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
            keyboardType="number-pad"
            value={maxDevices}
            onChangeText={setMaxDevices}
          />
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Status</Text>
          <View className="flex-row gap-2">
            {[1, 0].map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg items-center border",
                  status === s
                    ? s === 1
                      ? "bg-green-500/20 border-green-500/50"
                      : "bg-red-500/20 border-red-500/50"
                    : "bg-card border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-sm font-medium",
                    status === s
                      ? s === 1
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-muted-foreground"
                  )}
                >
                  {s === 1 ? "Active" : "Blocked"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1">
            Devices: {key.devices?.length ?? 0}/{key.maxDevices}
          </Text>
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1">Registrator</Text>
          <Text className="text-muted-foreground text-sm">{key.registrator}</Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="bg-primary py-3.5 rounded-lg items-center mt-2"
        >
          <Text className="text-primary-foreground font-semibold text-sm">
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}