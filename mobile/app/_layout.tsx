import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth/context";
import { AppUpdater } from "@/components/AppUpdater";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "hsl(240 10% 3.9%)" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(panel)" />
        </Stack>
        <AppUpdater />
      </AuthProvider>
    </ThemeProvider>
  );
}