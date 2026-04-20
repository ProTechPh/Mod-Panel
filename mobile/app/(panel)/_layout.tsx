import { Stack, Redirect, useRouter, usePathname } from "expo-router";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import {
  LayoutDashboard,
  Key,
  History,
  Settings,
  Server,
  BookOpen,
  Users,
  Gamepad2,
  Menu,
  X,
  LogOut,
  HardDrive,
} from "lucide-react-native";

const mainMenuItems = [
  { name: "dashboard", title: "Dashboard", icon: LayoutDashboard, minLevel: 3 },
  { name: "keys", title: "Keys", icon: Key, minLevel: 3 },
  { name: "history", title: "History", icon: History, minLevel: 3 },
  { name: "settings", title: "Settings", icon: Settings, minLevel: 3 },
];

const adminMenuItems = [
  { name: "server", title: "Server Config", icon: Server, minLevel: 1 },
  { name: "lib", title: "Library", icon: HardDrive, minLevel: 2 },
  { name: "admin/users", title: "Users", icon: Users, minLevel: 1 },
  { name: "admin/game-settings", title: "Game Settings", icon: Gamepad2, minLevel: 2 },
  { name: "docs", title: "API Docs", icon: BookOpen, minLevel: 2 },
];

function MenuItem({
  title,
  icon: Icon,
  active,
  onPress,
}: {
  title: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl mx-2 mb-0.5 ${
        active ? "bg-purple-600/20" : "bg-transparent"
      }`}
    >
      <Icon size={18} color={active ? "#a855f7" : "#71717a"} />
      <Text className={`text-sm font-medium ${active ? "text-purple-400" : "text-muted-foreground"}`}>
        {title}
      </Text>
    </Pressable>
  );
}

export default function PanelLayout() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const userLevel = user.level ?? 3;

  const filteredMain = mainMenuItems.filter((item) => userLevel <= item.minLevel);
  const filteredAdmin = adminMenuItems.filter((item) => userLevel <= item.minLevel);

  const navigate = (name: string) => {
    setMenuOpen(false);
    router.replace(`/(panel)/${name}`);
  };

  const currentTitle =
    [...filteredMain, ...filteredAdmin].find((item) => pathname.includes(item.name))?.title ?? "Mod Panel";

  const headerHeight = 44;
  const headerTop = insets.top;

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: headerTop, height: headerTop + headerHeight }}
        className="flex-row items-center justify-between px-4 border-b border-border/50 bg-card"
      >
        <Pressable
          onPress={() => setMenuOpen(!menuOpen)}
          className="p-2 -ml-2 rounded-lg"
          hitSlop={12}
        >
          {menuOpen ? <X size={20} color="#fff" /> : <Menu size={20} color="#fff" />}
        </Pressable>
        <Text className="text-sm font-semibold text-foreground">{currentTitle}</Text>
        <View className="w-10" />
      </View>

      {menuOpen && (
        <Pressable
          style={{ top: headerTop + headerHeight }}
          className="absolute inset-x-0 bottom-0 z-10"
          onPress={() => setMenuOpen(false)}
        >
          <View className="flex-1 bg-black/60" />
        </Pressable>
      )}

      {menuOpen && (
        <View
          style={{ top: headerTop + headerHeight }}
          className="absolute left-0 right-0 z-20 bg-card border-b border-border/50 shadow-2xl"
        >
          <ScrollView
            className="py-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
          >
            {filteredMain.map((item) => (
              <MenuItem
                key={item.name}
                title={item.title}
                icon={item.icon}
                active={pathname.includes(item.name)}
                onPress={() => navigate(item.name)}
              />
            ))}

            {filteredAdmin.length > 0 && (
              <>
                <View className="mx-4 my-1.5 border-t border-border/50" />
                <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-0.5">
                  Admin
                </Text>
                {filteredAdmin.map((item) => (
                  <MenuItem
                    key={item.name}
                    title={item.title}
                    icon={item.icon}
                    active={pathname.includes(item.name)}
                    onPress={() => navigate(item.name)}
                  />
                ))}
              </>
            )}

            <View className="mx-4 my-1.5 border-t border-border/50" />

            <View className="px-4 py-2 flex-row items-center gap-3">
              <View className="size-7 rounded-full bg-purple-600/30 items-center justify-center">
                <Text className="text-[11px] font-bold text-purple-400">
                  {user.username?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{user.fullname || user.username}</Text>
                <Text className="text-[11px] text-muted-foreground">
                  {userLevel === 1 ? "Owner" : userLevel === 2 ? "Admin" : "Reseller"}
                </Text>
              </View>
              <Pressable onPress={logout} className="p-2 rounded-lg">
                <LogOut size={16} color="#ef4444" />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "hsl(240 10% 3.9%)" },
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="keys/index" options={{ title: "Keys" }} />
        <Stack.Screen name="keys/[id]" options={{ title: "Edit Key" }} />
        <Stack.Screen name="keys/generate" options={{ title: "Generate Keys" }} />
        <Stack.Screen name="history" options={{ title: "History" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="server" options={{ title: "Server Config" }} />
        <Stack.Screen name="lib" options={{ title: "Library" }} />
        <Stack.Screen name="docs" options={{ title: "API Docs" }} />
        <Stack.Screen name="admin/users" options={{ title: "Users" }} />
        <Stack.Screen name="admin/users/[id]" options={{ title: "Edit User" }} />
        <Stack.Screen name="admin/game-settings" options={{ title: "Game Settings" }} />
      </Stack>
    </View>
  );
}