import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const fullnameSchema = z.object({
  fullname: z.string().min(1, "Full name is required").max(100),
});

export default function SettingsScreen() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [pwLoading, setPwLoading] = useState(false);
  const [fnLoading, setFnLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [telegramContact, setTelegramContact] = useState("");
  const [dcLoading, setDcLoading] = useState(false);

  useEffect(() => {
    if (user?.telegramContact) setTelegramContact(user.telegramContact);
  }, [user]);

  const {
    control: pwControl,
    handleSubmit: handlePwSubmit,
    formState: { errors: pwErrors },
    reset: resetPw,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const {
    control: fnControl,
    handleSubmit: handleFnSubmit,
    formState: { errors: fnErrors },
  } = useForm({
    resolver: zodResolver(fullnameSchema),
    defaultValues: { fullname: "" },
  });

  const onPasswordSubmit = async (data: any) => {
    setPwLoading(true);
    try {
      await api.post("/api/auth/change-password", data);
      toast.success("Success", "Password changed");
      resetPw();
    } catch (e: any) {
      toast.error("Error", e.message);
    } finally {
      setPwLoading(false);
    }
  };

  const onFullnameSubmit = async (data: any) => {
    setFnLoading(true);
    try {
      await api.post("/api/users/update-fullname", data);
      toast.success("Success", "Fullname updated");
      refreshUser();
    } catch (e: any) {
      toast.error("Error", e.message);
    } finally {
      setFnLoading(false);
    }
  };

  const onTelegramSave = async () => {
    setTgLoading(true);
    try {
      await api.post("/api/users/update-telegram", { telegramContact });
      toast.success("Success", "Telegram contact updated");
      refreshUser();
    } catch (e: any) {
      toast.error("Error", e.message);
    } finally {
      setTgLoading(false);
    }
  };

  const onDisconnectTelegram = async () => {
    toast.confirm("Disconnect Telegram", "Are you sure?", async () => {
      setDcLoading(true);
      try {
        await api.post("/api/auth/telegram/disconnect");
        toast.success("Success", "Telegram disconnected");
        refreshUser();
      } catch (e: any) {
        toast.error("Error", e.message);
      } finally {
        setDcLoading(false);
      }
    });
  };

  const { logout } = useAuth();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
    >
      <Text className="text-2xl font-bold text-foreground tracking-tight mb-4">Settings</Text>

      {/* Change Password */}
      <View className="bg-card border border-border/50 rounded-xl p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Change Password</Text>
        <View className="gap-3">
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">Current Password</Text>
            <Controller
              control={pwControl}
              name="currentPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
                  secureTextEntry
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {pwErrors.currentPassword && (
              <Text className="text-destructive text-xs mt-1">
                {pwErrors.currentPassword.message}
              </Text>
            )}
          </View>
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">New Password</Text>
            <Controller
              control={pwControl}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
                  secureTextEntry
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {pwErrors.newPassword && (
              <Text className="text-destructive text-xs mt-1">
                {pwErrors.newPassword.message}
              </Text>
            )}
          </View>
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">Confirm Password</Text>
            <Controller
              control={pwControl}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
                  secureTextEntry
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {pwErrors.confirmPassword && (
              <Text className="text-destructive text-xs mt-1">
                {pwErrors.confirmPassword.message}
              </Text>
            )}
          </View>
          <Pressable
            onPress={handlePwSubmit(onPasswordSubmit)}
            disabled={pwLoading}
            className="bg-primary py-3 rounded-lg items-center"
          >
            <Text className="text-primary-foreground font-semibold text-sm">
              {pwLoading ? "Changing..." : "Change Password"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Update Fullname */}
      <View className="bg-card border border-border/50 rounded-xl p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Update Fullname</Text>
        <Text className="text-sm text-muted-foreground mb-1.5">
          Current: {user?.fullname || "—"}
        </Text>
        <Controller
          control={fnControl}
          name="fullname"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
              onChangeText={onChange}
              value={value}
              placeholder="New fullname"
              placeholderTextColor="#71717a"
            />
          )}
        />
        {fnErrors.fullname && (
          <Text className="text-destructive text-xs mt-1">{fnErrors.fullname.message}</Text>
        )}
        <Pressable
          onPress={handleFnSubmit(onFullnameSubmit)}
          disabled={fnLoading}
          className="bg-primary py-3 rounded-lg items-center mt-3"
        >
          <Text className="text-primary-foreground font-semibold text-sm">
            {fnLoading ? "Updating..." : "Update Fullname"}
          </Text>
        </Pressable>
      </View>

      {/* Telegram Contact */}
      <View className="bg-card border border-border/50 rounded-xl p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Telegram Contact</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm"
          value={telegramContact}
          onChangeText={setTelegramContact}
          placeholder="e.g., @CanKillYouForever"
          placeholderTextColor="#71717a"
        />
        <Pressable
          onPress={onTelegramSave}
          disabled={tgLoading}
          className="bg-primary py-3 rounded-lg items-center mt-3"
        >
          <Text className="text-primary-foreground font-semibold text-sm">
            {tgLoading ? "Saving..." : "Save Telegram Contact"}
          </Text>
        </Pressable>
      </View>

      {/* Connected Accounts */}
      <View className="bg-card border border-border/50 rounded-xl p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Connected Accounts</Text>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-foreground font-medium">Telegram</Text>
            {user?.telegramId ? (
              <Text className="text-xs text-muted-foreground">
                @{user.telegramUsername || user.telegramId}
              </Text>
            ) : (
              <Text className="text-xs text-muted-foreground">Not connected</Text>
            )}
          </View>
          {user?.telegramId ? (
            <Pressable
              onPress={onDisconnectTelegram}
              disabled={dcLoading}
              className="bg-destructive/20 px-3 py-2 rounded-lg"
            >
              <Text className="text-destructive text-xs font-medium">
                {dcLoading ? "..." : "Disconnect"}
              </Text>
            </Pressable>
          ) : (
            <View className="bg-muted px-3 py-2 rounded-lg">
              <Text className="text-muted-foreground text-xs font-medium">Connect on Web</Text>
            </View>
          )}
        </View>
      </View>

      {/* Logout */}
      <Pressable
        onPress={logout}
        className="bg-destructive/20 border border-destructive/50 py-3.5 rounded-lg items-center mt-2"
      >
        <Text className="text-destructive font-semibold text-sm">Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}