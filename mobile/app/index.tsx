import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Redirect } from "expo-router";
import { useAuth } from "@/lib/auth/context";
import { APP_NAME } from "@/lib/constants";

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  // Still checking auth state — show spinner
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  // Already logged in — skip landing page and go straight to dashboard
  if (user) {
    return <Redirect href="/(panel)/dashboard" />;
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center gap-4">
            <Image
              source={require("@/assets/icon.png")}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
            <Text className="text-5xl font-bold tracking-tighter text-foreground">
              {APP_NAME}
            </Text>
            <Text className="text-lg text-muted-foreground text-center max-w-xs">
              Premium game mod management. Secure keys, real-time status, seamless downloads.
            </Text>
          </View>

          <View className="mt-10 gap-3 w-full max-w-xs">
            <Pressable
              onPress={() => router.replace("/login")}
              className="w-full bg-primary py-3.5 rounded-lg items-center"
            >
              <Text className="text-primary-foreground font-semibold text-sm">Sign In</Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace("/register")}
              className="w-full border border-border bg-card py-3.5 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold text-sm">Create Account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}