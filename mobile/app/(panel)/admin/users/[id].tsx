import { View, Text, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { levelName, cn } from "@/lib/utils";
import type { UserItem } from "@/types";

export default function UserEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [level, setLevel] = useState<number>(3);
  const [saldo, setSaldo] = useState("");
  const [status, setStatus] = useState<number>(1);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/users/${id}`)
      .then((data) => {
        setUser(data);
        setLevel(data.level);
        setSaldo(String(data.saldo));
        setStatus(data.status);
      })
      .catch((e: any) => Alert.alert("Error", e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.put(`/api/users/${id}`, {
        level,
        saldo: Number(saldo),
        status,
      });
      Alert.alert("Success", "User updated", [{ text: "OK", onPress: () => router.back() }]);
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

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: "Edit User" }} />

      <View className="bg-card border border-border/50 rounded-xl p-4 gap-4">
        <View>
          <Text className="text-sm text-muted-foreground mb-1">Username</Text>
          <Text className="text-foreground font-semibold">{user?.username}</Text>
        </View>
        <View>
          <Text className="text-sm text-muted-foreground mb-1">Email</Text>
          <Text className="text-foreground text-sm">{user?.email}</Text>
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Level</Text>
          <View className="flex-row gap-2">
            {([1, 2, 3] as const).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLevel(l)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg items-center border",
                  level === l ? "bg-primary/20 border-primary/50" : "bg-card border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-sm font-medium",
                    level === l ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {levelName(l)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Status</Text>
          <View className="flex-row gap-2">
            {([1, 2, 3] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg items-center border",
                  status === s
                    ? s === 1
                      ? "bg-green-500/20 border-green-500/50"
                      : s === 2
                      ? "bg-red-500/20 border-red-500/50"
                      : "bg-yellow-500/20 border-yellow-500/50"
                    : "bg-card border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium",
                    status === s
                      ? s === 1
                        ? "text-green-400"
                        : s === 2
                        ? "text-red-400"
                        : "text-yellow-400"
                      : "text-muted-foreground"
                  )}
                >
                  {s === 1 ? "Active" : s === 2 ? "Banned" : "Expired"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Saldo</Text>
          <TextInput
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm font-mono"
            keyboardType="decimal-pad"
            value={saldo}
            onChangeText={setSaldo}
          />
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