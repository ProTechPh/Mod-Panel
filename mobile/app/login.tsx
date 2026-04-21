import { View, Text, TextInput, Pressable, Image, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { saveTokens, saveCookieValues } from "@/lib/auth/token";
import { useAuth } from "@/lib/auth/context";
import { useToast } from "@/components/Toast";
import { APP_NAME } from "@/lib/constants";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const result = await api.post("/api/auth/login", data);
      if (result.accessToken) {
        await saveTokens(result.accessToken, result.refreshToken || "");
        // Save raw cookie values for manual Cookie header (React Native can't send httpOnly cookies)
        await saveCookieValues(result.accessToken, result.refreshToken || "");
      }
      if (result.accessToken || result.success) {
        const user = await refreshUser();
          if (user) {
            router.replace("/(panel)/dashboard");
          } else {
            toast.error("Error", "Could not load user profile.");
          }
        }
      } catch (e: any) {
        toast.error("Login Failed", e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 justify-center flex-1">
            <View className="items-center gap-3 mb-8">
              <Image
                source={require("@/assets/icon.png")}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
              <Text className="text-2xl font-bold text-foreground">{APP_NAME}</Text>
              <Text className="text-muted-foreground text-sm">Sign in to your account</Text>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-sm text-muted-foreground mb-1.5">Username or Email</Text>
                <Controller
                  control={control}
                  name="identifier"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="bg-card border border-border rounded-lg px-4 py-3 text-foreground text-sm"
                      placeholder="Enter username or email"
                      placeholderTextColor="#71717a"
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.identifier && (
                  <Text className="text-destructive text-xs mt-1">{errors.identifier.message}</Text>
                )}
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-1.5">Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="bg-card border border-border rounded-lg px-4 py-3 text-foreground text-sm"
                      placeholder="Enter password"
                      placeholderTextColor="#71717a"
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.password && (
                  <Text className="text-destructive text-xs mt-1">{errors.password.message}</Text>
                )}
              </View>

              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                className="bg-primary py-3.5 rounded-lg items-center mt-2"
              >
                <Text className="text-primary-foreground font-semibold text-sm">
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </Pressable>

              <Pressable onPress={() => router.replace("/register")} className="items-center mt-2">
                <Text className="text-muted-foreground text-sm">
                  Don't have an account?{" "}
                  <Text className="text-primary font-semibold">Register</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}