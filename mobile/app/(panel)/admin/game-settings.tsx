import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  FlatList,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import type { GameSettingItem } from "@/types";
import { Edit3, Trash2, Plus, X, Copy } from "lucide-react-native";

const FEATURE_LABELS: Record<string, string> = {
  esp: "ESP",
  item: "Item",
  silentAim: "Silent Aim",
  aim: "AIM",
  bulletTrack: "Bullet Track",
  memory: "Memory",
  floating: "Floating",
  setting: "Setting",
};

export default function GameSettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GameSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editGame, setEditGame] = useState<GameSettingItem | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ gameCode: "", gameName: "" });

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

  const handleToggle = async (
    gameCode: string,
    field: string,
    value: boolean,
    registrator?: string
  ) => {
    try {
      await api.post("/api/game-settings", {
        gameCode,
        [field]: value,
        registrator,
      });
      fetchSettings();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDelete = async (gameCode: string, registrator?: string) => {
    Alert.alert("Delete Game", `Delete game ${gameCode}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.post("/api/game-settings", {
              _method: "DELETE",
              gameCode,
              registrator,
            });
            Alert.alert("Success", "Game deleted");
            fetchSettings();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    try {
      await api.post("/api/game-settings", addForm);
      Alert.alert("Success", "Game added");
      setAddModal(false);
      setAddForm({ gameCode: "", gameName: "" });
      fetchSettings();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleSaveGame = async () => {
    if (!editGame) return;
    try {
      await api.post("/api/game-settings", {
        gameCode: editGame.gameCode,
        registrator: editGame.registrator,
        maintenanceMessage: editGame.maintenanceMessage,
        downloadLink: editGame.downloadLink,
        floatingTextStatus: editGame.floatingTextStatus,
        floatingText: editGame.floatingText,
        modName: editGame.modName,
        telegramChannel: editGame.telegramChannel,
        telegramGroup: editGame.telegramGroup,
        features: editGame.features,
      });
      Alert.alert("Success", "Game settings saved");
      setEditGame(null);
      setExpandedId(null);
      fetchSettings();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const toggleFeature = (key: string) => {
    if (!editGame) return;
    setEditGame({
      ...editGame,
      features: {
        ...editGame.features,
        [key]: !editGame.features[key as keyof typeof editGame.features],
      },
    });
  };

  const openEditGame = (game: GameSettingItem) => {
    if (expandedId === game._id) {
      setExpandedId(null);
      setEditGame(null);
    } else {
      setEditGame({ ...game });
      setExpandedId(game._id);
    }
  };

  const copyFreeKeyLink = (registrator: string) => {
    Alert.alert("Copied", `Free key link: /${registrator}/free-key`);
  };

  const inputClass =
    "bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm";

  const renderItem = ({ item }: { item: GameSettingItem }) => {
    const isExpanded = expandedId === item._id;

    return (
      <View className="bg-card border border-border/50 rounded-xl mb-3 overflow-hidden">
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2 flex-1">
              <View className="px-2 py-0.5 rounded border border-border bg-muted">
                <Text className="text-xs font-mono text-foreground">
                  {item.gameCode}
                </Text>
              </View>
              <Text className="text-foreground font-semibold text-sm">
                {item.gameName}
              </Text>
              {item.registrator ? (
                <View className="px-1.5 py-0.5 rounded bg-muted">
                  <Text className="text-[10px] text-muted-foreground">
                    {item.registrator}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={() => openEditGame(item)}
                className="p-2 rounded-lg"
              >
                {isExpanded ? (
                  <X size={16} color="#a1a1aa" />
                ) : (
                  <Edit3 size={16} color="#a1a1aa" />
                )}
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item.gameCode, item.registrator)}
                className="p-2 rounded-lg"
              >
                <Trash2 size={16} color="#ef4444" />
              </Pressable>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3 mb-3">
            <View className="flex-row items-center gap-1.5">
              <Switch
                value={item.isEnabled}
                onValueChange={(v) =>
                  handleToggle(item.gameCode, "isEnabled", v, item.registrator)
                }
                trackColor={{ false: "#27272a", true: "#a855f7" }}
                thumbColor="#fff"
              />
              <Text className="text-xs text-muted-foreground">Enabled</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Switch
                value={item.connectEnabled}
                onValueChange={(v) =>
                  handleToggle(
                    item.gameCode,
                    "connectEnabled",
                    v,
                    item.registrator
                  )
                }
                trackColor={{ false: "#27272a", true: "#a855f7" }}
                thumbColor="#fff"
              />
              <Text className="text-xs text-muted-foreground">Connect</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Switch
                value={item.freeKeyEnabled}
                onValueChange={(v) =>
                  handleToggle(
                    item.gameCode,
                    "freeKeyEnabled",
                    v,
                    item.registrator
                  )
                }
                trackColor={{ false: "#27272a", true: "#a855f7" }}
                thumbColor="#fff"
              />
              <Text className="text-xs text-muted-foreground">Free Key</Text>
            </View>
            {item.registrator ? (
              <Pressable
                onPress={() => copyFreeKeyLink(item.registrator)}
                className="flex-row items-center gap-1 px-2 py-1 rounded-md border border-border bg-muted"
              >
                <Copy size={12} color="#a1a1aa" />
                <Text className="text-xs text-muted-foreground">Free Key Link</Text>
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-2">
            {Object.entries(item.features).map(([key, value]) => (
              <View
                key={key}
                className={`px-2.5 py-1 rounded-md border ${
                  value
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-muted border-border"
                }`}
              >
                <Text
                  className={`text-xs ${
                    value ? "text-green-400" : "text-muted-foreground"
                  }`}
                >
                  {FEATURE_LABELS[key] || key}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {isExpanded && editGame && editGame._id === item._id ? (
          <View className="border-t border-border/50 px-4 py-4 gap-3">
            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">
                Maintenance Message
              </Text>
              <TextInput
                className={inputClass}
                value={editGame.maintenanceMessage || ""}
                onChangeText={(v) =>
                  setEditGame({ ...editGame, maintenanceMessage: v })
                }
                placeholder="Game-specific maintenance message"
                placeholderTextColor="#71717a"
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">
                Download Link
              </Text>
              <TextInput
                className={inputClass}
                value={editGame.downloadLink || ""}
                onChangeText={(v) =>
                  setEditGame({ ...editGame, downloadLink: v })
                }
                placeholder="Mod download URL"
                placeholderTextColor="#71717a"
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">
                Mod Name
              </Text>
              <TextInput
                className={inputClass}
                value={editGame.modName || ""}
                onChangeText={(v) => setEditGame({ ...editGame, modName: v })}
                placeholder="e.g., Winter Mod, ProTech Mod"
                placeholderTextColor="#71717a"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm text-muted-foreground mb-1.5">
                  Telegram Channel
                </Text>
                <TextInput
                  className={inputClass}
                  value={editGame.telegramChannel || ""}
                  onChangeText={(v) =>
                    setEditGame({ ...editGame, telegramChannel: v })
                  }
                  placeholder="https://t.me/channel"
                  placeholderTextColor="#71717a"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-muted-foreground mb-1.5">
                  Telegram Group
                </Text>
                <TextInput
                  className={inputClass}
                  value={editGame.telegramGroup || ""}
                  onChangeText={(v) =>
                    setEditGame({ ...editGame, telegramGroup: v })
                  }
                  placeholder="https://t.me/group"
                  placeholderTextColor="#71717a"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">
                Floating Text Status
              </Text>
              <TextInput
                className={inputClass}
                value={editGame.floatingTextStatus || ""}
                onChangeText={(v) =>
                  setEditGame({ ...editGame, floatingTextStatus: v })
                }
                placeholder="e.g., active, vip"
                placeholderTextColor="#71717a"
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">
                Floating Text
              </Text>
              <TextInput
                className={inputClass}
                value={editGame.floatingText || ""}
                onChangeText={(v) =>
                  setEditGame({ ...editGame, floatingText: v })
                }
                placeholder="Text shown as floating overlay in-game"
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={3}
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-2">Features</Text>
              <View className="flex-row flex-wrap gap-2">
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => toggleFeature(key)}
                    className={`px-3 py-2 rounded-lg border flex-row items-center gap-1.5 ${
                      editGame.features?.[
                        key as keyof typeof editGame.features
                      ]
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-muted border-border"
                    }`}
                  >
                    <View
                      className={`w-3 h-3 rounded-sm border ${
                        editGame.features?.[
                          key as keyof typeof editGame.features
                        ]
                          ? "bg-green-500 border-green-500"
                          : "border-border"
                      }`}
                    />
                    <Text
                      className={`text-xs ${
                        editGame.features?.[
                          key as keyof typeof editGame.features
                        ]
                          ? "text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={handleSaveGame}
              className="bg-primary py-3 rounded-lg items-center mt-1"
            >
              <Text className="text-primary-foreground font-semibold text-sm">
                Save Game Settings
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground tracking-tight">
            Game Settings
          </Text>
          <Pressable
            onPress={() => setAddModal(true)}
            className="bg-primary px-3 py-2 rounded-lg flex-row items-center gap-1.5"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-primary-foreground text-sm font-medium">
              Add Game
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={settings}
        keyExtractor={(item) => `${item.gameCode}-${item.registrator}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted-foreground">
              {loading ? "Loading..." : "No game settings"}
            </Text>
          </View>
        }
      />

      {addModal ? (
        <View className="absolute inset-0 z-50 flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-card border border-border rounded-xl p-5 w-full gap-4">
            <Text className="text-lg font-semibold text-foreground">
              Add Game
            </Text>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">
                Game Code
              </Text>
              <TextInput
                className={inputClass}
                value={addForm.gameCode}
                onChangeText={(v) =>
                  setAddForm({ ...addForm, gameCode: v.toUpperCase() })
                }
                placeholder="e.g., CODM"
                placeholderTextColor="#71717a"
                autoCapitalize="characters"
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">
                Game Name
              </Text>
              <TextInput
                className={inputClass}
                value={addForm.gameName}
                onChangeText={(v) =>
                  setAddForm({ ...addForm, gameName: v })
                }
                placeholder="e.g., Call of Duty Mobile"
                placeholderTextColor="#71717a"
              />
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setAddModal(false)}
                className="flex-1 bg-muted py-3 rounded-lg items-center"
              >
                <Text className="text-foreground font-medium text-sm">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                className="flex-1 bg-primary py-3 rounded-lg items-center"
              >
                <Text className="text-primary-foreground font-medium text-sm">
                  Add Game
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}