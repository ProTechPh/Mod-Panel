import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { GameOption } from "@/types";

const DURATIONS = [
  { value: "1h", label: "1 Hour" },
  { value: "6h", label: "6 Hours" },
  { value: "1", label: "1 Day" },
  { value: "3", label: "3 Days" },
  { value: "7", label: "7 Days" },
  { value: "14", label: "14 Days" },
  { value: "30", label: "30 Days" },
  { value: "60", label: "60 Days" },
  { value: "90", label: "90 Days" },
];

export default function KeyGenerateScreen() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [game, setGame] = useState("");
  const [duration, setDuration] = useState("1");
  const [maxDevices, setMaxDevices] = useState("1");
  const [count, setCount] = useState("1");
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  useEffect(() => {
    api
      .get("/api/game-settings?mine=true")
      .then((data) => setGames(Array.isArray(data) ? data : []))
      .catch(() => setGames([]));
  }, []);

  const onSubmit = async () => {
    if (!game) {
      toast.error("No Game", "Please select a game");
      return;
    }
    setLoading(true);
    try {
      const result = await api.post("/api/keys/generate", {
        game,
        duration,
        maxDevices: Number(maxDevices),
        count: Number(count),
      });
      setGeneratedKeys(result.keys || []);
      toast.success("Generated", `Generated ${result.keys?.length || 0} key(s)`);
    } catch (e: any) {
      toast.error("Error", e.message || "Failed to generate keys");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (generatedKeys.length === 0) return;
    const text = generatedKeys.join("\n");
    await Clipboard.setStringAsync(text);
    toast.info("Copied", "Keys copied to clipboard");
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold text-foreground tracking-tight mb-4">
        Generate Keys
      </Text>

      <View className="bg-card border border-border/50 rounded-xl p-4 gap-4">
        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Game</Text>
          <Pressable
            onPress={() => setShowGamePicker(!showGamePicker)}
            className="bg-background border border-border rounded-lg px-4 py-3"
          >
            <Text className="text-foreground text-sm">
              {games.find((g) => g.gameCode === game)?.gameName || "Select game"}
            </Text>
          </Pressable>
          {showGamePicker &&
            games.map((g) => (
              <Pressable
                key={`${g.gameCode}-${g.registrator}`}
                onPress={() => {
                  setGame(g.gameCode);
                  setShowGamePicker(false);
                }}
                className="px-4 py-2.5 border-b border-border/30"
              >
                <Text className="text-foreground text-sm">
                  {g.gameName} ({g.gameCode})
                </Text>
              </Pressable>
            ))}
        </View>

        <View>
          <Text className="text-sm text-muted-foreground mb-1.5">Duration</Text>
          <Pressable
            onPress={() => setShowDurationPicker(!showDurationPicker)}
            className="bg-background border border-border rounded-lg px-4 py-3"
          >
            <Text className="text-foreground text-sm">
              {DURATIONS.find((d) => d.value === duration)?.label || "Select duration"}
            </Text>
          </Pressable>
          {showDurationPicker &&
            DURATIONS.map((d) => (
              <Pressable
                key={d.value}
                onPress={() => {
                  setDuration(d.value);
                  setShowDurationPicker(false);
                }}
                className="px-4 py-2.5 border-b border-border/30"
              >
                <Text className="text-foreground text-sm">{d.label}</Text>
              </Pressable>
            ))}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-sm text-muted-foreground mb-1.5">Max Devices</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
              keyboardType="number-pad"
              value={maxDevices}
              onChangeText={setMaxDevices}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-muted-foreground mb-1.5">Count</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
              keyboardType="number-pad"
              value={count}
              onChangeText={setCount}
            />
          </View>
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          className="bg-primary py-3.5 rounded-lg items-center"
        >
          <Text className="text-primary-foreground font-semibold text-sm">
            {loading ? "Generating..." : "Generate Keys"}
          </Text>
        </Pressable>
      </View>

      {generatedKeys.length > 0 && (
        <View className="bg-card border border-border/50 rounded-xl p-4 mt-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Generated Keys</Text>
          <View className="bg-muted rounded-lg p-3 max-h-48">
            {generatedKeys.map((key, i) => (
              <Text key={i} className="font-mono text-sm text-foreground py-0.5">
                {key}
              </Text>
            ))}
          </View>
          <Pressable
            onPress={copyAll}
            className="border border-border rounded-lg py-2.5 items-center mt-3"
          >
            <Text className="text-foreground text-sm font-medium">Copy All</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}