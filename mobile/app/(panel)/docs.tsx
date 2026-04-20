import { View, Text, ScrollView } from "react-native";
import { useAuth } from "@/lib/auth/context";

export default function DocsScreen() {
  const { user } = useAuth();

  if (user?.level !== 1 && user?.level !== 2) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Access denied</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold text-foreground tracking-tight mb-4">API Documentation</Text>

      <View className="bg-card border border-border/50 rounded-xl p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Connect API</Text>
        <Text className="text-sm text-muted-foreground mb-2">
          POST /api/connect
        </Text>
        <Text className="text-sm text-muted-foreground mb-4">
          The endpoint used by the mod client software to validate keys.
        </Text>

        <Text className="text-sm font-medium text-foreground mb-2">Request (form-data)</Text>
        <View className="bg-muted rounded-lg p-3 mb-3">
          <Text className="font-mono text-xs text-foreground">game: string</Text>
          <Text className="font-mono text-xs text-foreground">user_key: string</Text>
          <Text className="font-mono text-xs text-foreground">serial: string</Text>
        </View>

        <Text className="text-sm font-medium text-foreground mb-2">Response</Text>
        <View className="bg-muted rounded-lg p-3">
          <Text className="font-mono text-xs text-foreground">{"{"}</Text>
          <Text className="font-mono text-xs text-foreground pl-4">status: "success" | "error"</Text>
          <Text className="font-mono text-xs text-foreground pl-4">features: {`{ esp, aim, ... }`}</Text>
          <Text className="font-mono text-xs text-foreground pl-4">token: string (MD5)</Text>
          <Text className="font-mono text-xs text-foreground pl-4">expire: string</Text>
          <Text className="font-mono text-xs text-foreground">{"}"}</Text>
        </View>
      </View>

      <View className="bg-card border border-border/50 rounded-xl p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Library API</Text>
        <Text className="text-sm text-muted-foreground mb-2">GET /api/libs</Text>
        <Text className="text-sm text-muted-foreground mb-2">POST /api/libs (multipart)</Text>
        <Text className="text-sm text-muted-foreground">DELETE /api/libs?fileName=...</Text>
      </View>

      <View className="bg-card border border-border/50 rounded-xl p-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Authentication</Text>
        <Text className="text-sm text-muted-foreground mb-2">
          All protected endpoints require a Bearer token in the Authorization header.
        </Text>
        <View className="bg-muted rounded-lg p-3">
          <Text className="font-mono text-xs text-foreground">
            Authorization: Bearer {"<access_token>"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}