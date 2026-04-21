import { View, Text, TextInput, Pressable, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { saveTokens } from "@/lib/auth/token";
import { useAuth } from "@/lib/auth/context";
import { APP_NAME } from "@/lib/constants";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
    email: z.email("Invalid email address"),
    fullname: z.string().min(1, "Full name is required").max(100),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    referralCode: z.string().min(1, "Referral code is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullname: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const result = await api.post("/api/auth/register", data);
      if (result.accessToken) {
        await saveTokens(result.accessToken, result.refreshToken || "");
      }
      if (result.accessToken || result.success) {
        await refreshUser();
        router.replace("/(panel)/dashboard");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "username" as const, label: "Username", placeholder: "Choose a username", autoCapitalize: "none" as const },
    { name: "email" as const, label: "Email", placeholder: "Enter email", keyboardType: "email-address" as const, autoCapitalize: "none" as const },
    { name: "fullname" as const, label: "Full Name", placeholder: "Enter full name" },
    { name: "password" as const, label: "Password", placeholder: "Choose a password", secure: true, autoCapitalize: "none" as const },
    { name: "confirmPassword" as const, label: "Confirm Password", placeholder: "Confirm password", secure: true, autoCapitalize: "none" as const },
    { name: "referralCode" as const, label: "Referral Code", placeholder: "Enter referral code", autoCapitalize: "none" as const },
  ];

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6">
            <View className="items-center gap-3 mb-8">
              <Image
                source={require("@/assets/icon.png")}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
              <Text className="text-2xl font-bold text-foreground">{APP_NAME}</Text>
              <Text className="text-muted-foreground text-sm">Create a new account</Text>
            </View>

            <View className="gap-4">
              {fields.map((field) => (
                <View key={field.name}>
                  <Text className="text-sm text-muted-foreground mb-1.5">{field.label}</Text>
                  <Controller
                    control={control}
                    name={field.name}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="bg-card border border-border rounded-lg px-4 py-3 text-foreground text-sm"
                        placeholder={field.placeholder}
                        placeholderTextColor="#71717a"
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={field.secure}
                        autoCapitalize={field.autoCapitalize || "sentences"}
                        keyboardType={field.keyboardType || "default"}
                      />
                    )}
                  />
                  {errors[field.name] && (
                    <Text className="text-destructive text-xs mt-1">{errors[field.name]?.message}</Text>
                  )}
                </View>
              ))}

              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                className="bg-primary py-3.5 rounded-lg items-center mt-2"
              >
                <Text className="text-primary-foreground font-semibold text-sm">
                  {loading ? "Creating account..." : "Create Account"}
                </Text>
              </Pressable>

              <Pressable onPress={() => router.replace("/login")} className="items-center mt-2">
                <Text className="text-muted-foreground text-sm">
                  Already have an account?{" "}
                  <Text className="text-primary font-semibold">Sign in</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}