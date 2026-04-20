import { View, Text, TextInput, FlatList, Pressable, Alert, RefreshControl } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import { levelName, cn } from "@/lib/utils";
import type { UserItem, ReferralItem } from "@/types";
import { Search, Edit3, Trash2, Users, Gift, Plus } from "lucide-react-native";

type Tab = "users" | "referrals";

export default function UsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [refLoading, setRefLoading] = useState(true);

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

  const fetchReferrals = useCallback(async () => {
    setRefLoading(true);
    try {
      const data = await api.get("/api/referrals");
      setReferrals(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setRefLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.level === 1) {
      fetchUsers();
      fetchReferrals();
    }
  }, [user, fetchUsers, fetchReferrals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (tab === "users") await fetchUsers(search);
    else await fetchReferrals();
    setRefreshing(false);
  }, [fetchUsers, fetchReferrals, search, tab]);

  if (user?.level !== 1) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Access denied</Text>
      </View>
    );
  }

  const handleDeleteUser = async (id: string) => {
    Alert.alert("Delete User", "Delete this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/users/${id}`);
            Alert.alert("Success", "User deleted");
            fetchUsers(search);
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteReferral = async (id: string) => {
    Alert.alert("Delete Referral", "Delete this referral?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/referrals?id=${id}`);
            Alert.alert("Success", "Referral deleted");
            fetchReferrals();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const [addRefModal, setAddRefModal] = useState(false);
  const [refForm, setRefForm] = useState({ level: "3", setSaldo: "0", accExpirationDays: "30" });
  const [creatingRef, setCreatingRef] = useState(false);

  const handleCreateReferral = async () => {
    setCreatingRef(true);
    try {
      await api.post("/api/referrals", {
        level: Number(refForm.level),
        setSaldo: Number(refForm.setSaldo),
        accExpirationDays: Number(refForm.accExpirationDays),
      });
      Alert.alert("Success", "Referral created");
      setAddRefModal(false);
      setRefForm({ level: "3", setSaldo: "0", accExpirationDays: "30" });
      fetchReferrals();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCreatingRef(false);
    }
  };

  const inputClass = "bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm";

  const statusLabel = (s: number) => s === 1 ? "Active" : s === 2 ? "Banned" : "Expired";

  const renderUser = ({ item }: { item: UserItem }) => (
    <View className="bg-card border border-border/50 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
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
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-1">
          <Pressable
            onPress={() => router.replace(`/admin/users/${item._id}`)}
            className="bg-muted p-2 rounded-lg"
          >
            <Edit3 size={14} color="#a1a1aa" />
          </Pressable>
          <Pressable
            onPress={() => handleDeleteUser(item._id)}
            className="bg-red-500/20 p-2 rounded-lg"
          >
            <Trash2 size={14} color="#ef4444" />
          </Pressable>
        </View>
      </View>
      <View className="gap-0.5">
        <Text className="text-xs text-muted-foreground">Email: {item.email}</Text>
        <Text className="text-xs text-muted-foreground">Level: {levelName(item.level)}</Text>
        <Text className="text-xs text-muted-foreground">Saldo: ${item.saldo?.toFixed(2)}</Text>
        {item.expirationDate ? (
          <Text className="text-xs text-muted-foreground">
            Expires: {new Date(item.expirationDate).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const renderReferral = ({ item }: { item: ReferralItem }) => (
    <View className="bg-card border border-border/50 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-mono font-bold text-sm">{item.referralPlain || item._id}</Text>
        <View className="flex-row items-center gap-2">
          <View className="px-2 py-0.5 rounded border border-border bg-muted">
            <Text className="text-xs text-foreground">{levelName(item.level)}</Text>
          </View>
          {!item.usedBy || item.usedBy.length === 0 ? (
            <Pressable
              onPress={() => handleDeleteReferral(item._id)}
              className="bg-red-500/20 p-2 rounded-lg"
            >
              <Trash2 size={14} color="#ef4444" />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View className="gap-0.5">
        <Text className="text-xs text-muted-foreground">Saldo: ${item.setSaldo}</Text>
        <Text className="text-xs text-muted-foreground">
          Used by: {Array.isArray(item.usedBy) ? (item.usedBy.length > 0 ? item.usedBy.join(", ") : "Unused") : (item.usedBy || "Unused")}
        </Text>
        <Text className="text-xs text-muted-foreground">Created by: {item.createdBy}</Text>
        {item.accExpiration ? (
          <Text className="text-xs text-muted-foreground">
            Expires: {new Date(item.accExpiration).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground tracking-tight">
            Users & Referrals
          </Text>
        </View>
        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={() => setTab("users")}
            className={cn(
              "flex-row items-center gap-2 px-3 py-2 rounded-lg",
              tab === "users" ? "bg-primary" : "bg-muted"
            )}
          >
            <Users size={16} color={tab === "users" ? "#fff" : "#a1a1aa"} />
            <Text
              className={cn(
                "text-sm font-medium",
                tab === "users" ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Users
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("referrals")}
            className={cn(
              "flex-row items-center gap-2 px-3 py-2 rounded-lg",
              tab === "referrals" ? "bg-primary" : "bg-muted"
            )}
          >
            <Gift size={16} color={tab === "referrals" ? "#fff" : "#a1a1aa"} />
            <Text
              className={cn(
                "text-sm font-medium",
                tab === "referrals" ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Referrals
            </Text>
          </Pressable>
        </View>
      </View>

      {tab === "users" ? (
        <>
          <View className="px-4 mb-3">
            <View className="flex-row gap-2">
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
            renderItem={renderUser}
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
        </>
      ) : (
        <>
          <View className="px-4 mb-3">
            <Pressable
              onPress={() => setAddRefModal(true)}
              className="bg-primary px-4 py-2.5 rounded-lg flex-row items-center gap-2 self-start"
            >
              <Plus size={16} color="#fff" />
              <Text className="text-primary-foreground text-sm font-medium">Create Referral</Text>
            </Pressable>
          </View>
          <FlatList
            data={referrals}
            keyExtractor={(item) => item._id}
            renderItem={renderReferral}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-muted-foreground">{refLoading ? "Loading..." : "No referrals"}</Text>
              </View>
            }
          />
        </>
      )}

      {addRefModal ? (
        <View className="absolute inset-0 z-50 flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-card border border-border rounded-xl p-5 w-full gap-4">
            <Text className="text-lg font-semibold text-foreground">Create Referral Code</Text>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">Level</Text>
              <View className="flex-row gap-2">
                {(["1", "2", "3"] as const).map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setRefForm({ ...refForm, level: l })}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg items-center border",
                      refForm.level === l ? "bg-primary/20 border-primary/50" : "bg-card border-border"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm font-medium",
                        refForm.level === l ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {l === "1" ? "Owner" : l === "2" ? "Admin" : "Reseller"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">Set Saldo</Text>
              <TextInput
                className={inputClass}
                keyboardType="decimal-pad"
                value={refForm.setSaldo}
                onChangeText={(v) => setRefForm({ ...refForm, setSaldo: v })}
                placeholder="0"
                placeholderTextColor="#71717a"
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">Account Duration (days)</Text>
              <TextInput
                className={inputClass}
                keyboardType="number-pad"
                value={refForm.accExpirationDays}
                onChangeText={(v) => setRefForm({ ...refForm, accExpirationDays: v })}
                placeholder="30"
                placeholderTextColor="#71717a"
              />
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setAddRefModal(false)}
                className="flex-1 bg-muted py-3 rounded-lg items-center"
              >
                <Text className="text-foreground font-medium text-sm">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateReferral}
                disabled={creatingRef}
                className="flex-1 bg-primary py-3 rounded-lg items-center"
              >
                <Text className="text-primary-foreground font-medium text-sm">
                  {creatingRef ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}