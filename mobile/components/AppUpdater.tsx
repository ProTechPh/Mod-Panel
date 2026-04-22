import React, { useEffect, useRef, useState, useCallback } from "react";
import { Modal, View, Text, TouchableOpacity, Linking, Platform, ActivityIndicator } from "react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import pkg from "../package.json";
import { Rocket, ArrowRight, Download, RefreshCw } from "lucide-react-native";

const GITHUB_REPO = (Constants.expoConfig?.extra?.githubRepo as string) ?? "";
const CURRENT_VERSION = (Constants.expoConfig?.extra?.appVersion as string) || pkg.version;

const IS_DEV = __DEV__;

function parseVersion(v: string): number[] {
  return v.replace(/^v/, "").split(".").map(Number);
}

function isNewer(latest: string, current: string): boolean {
  const l = parseVersion(latest);
  const c = parseVersion(current);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] ?? 0;
    const cv = c[i] ?? 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

type UpdateType = "ota" | "apk";

export function AppUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateType, setUpdateType] = useState<UpdateType>("ota");
  const [latestVersion, setLatestVersion] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [applying, setApplying] = useState(false);
  const checked = useRef(false);

  const checkOtaUpdate = useCallback(async (): Promise<boolean> => {
    if (IS_DEV) {
      console.log("[AppUpdater] Skipping OTA check in dev mode");
      return false;
    }
    try {
      console.log("[AppUpdater] Current version:", CURRENT_VERSION);
      console.log("[AppUpdater] Checking for OTA update...");
      const update = await Updates.checkForUpdateAsync();
      console.log("[AppUpdater] OTA check result:", JSON.stringify(update));
      if (update.isAvailable) {
        // EAS Update manifest stores extras under expoClient.extra
        const manifest = update.manifest as any;

        // Try multiple paths to extract version from EAS Update manifest
        const version =
          manifest?.extra?.expoClient?.version ??
          manifest?.extra?.expoClient?.extra?.appVersion ??
          manifest?.extra?.appVersion ??
          manifest?.metadata?.appVersion ??
          manifest?.runtimeVersion ??
          null;

        console.log("[AppUpdater] OTA update manifest version:", version);
        console.log("[AppUpdater] Full manifest keys:", JSON.stringify(Object.keys(manifest ?? {})));
        console.log("[AppUpdater] manifest.extra keys:", JSON.stringify(Object.keys(manifest?.extra ?? {})));
        console.log("[AppUpdater] manifest.extra.expoClient keys:", JSON.stringify(Object.keys(manifest?.extra?.expoClient ?? {})));

        // If we can determine the version and it's not newer, skip the update prompt
        if (version && version !== "new" && !isNewer(version, CURRENT_VERSION)) {
          console.log("[AppUpdater] OTA version", version, "is not newer than current", CURRENT_VERSION, "- skipping");
          return false;
        }

        setUpdateType("ota");
        setLatestVersion(version ?? "new");
        setShowUpdate(true);
        return true;
      }
      console.log("[AppUpdater] No OTA update available");
    } catch (e) {
      console.log("[AppUpdater] OTA check error:", e);
      // OTA check failed, fall through to GitHub check
    }
    return false;
  }, []);

  const checkGithubUpdate = useCallback(async () => {
    if (!GITHUB_REPO || Platform.OS !== "android") return;
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) return;

      const release = await res.json();
      const latestTag: string = release.tag_name ?? "";
      const version = latestTag.replace(/^v/, "");

      if (!version || !isNewer(version, CURRENT_VERSION)) return;

      const apkAsset = (release.assets as any[]).find(
        (a: any) => a.name?.endsWith(".apk")
      );
      const url: string = apkAsset?.browser_download_url ?? release.html_url;

      setUpdateType("apk");
      setLatestVersion(version);
      setDownloadUrl(url);
      setShowUpdate(true);
    } catch {
      // Silently ignore network errors
    }
  }, []);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const check = async () => {
      const hasOta = await checkOtaUpdate();
      if (!hasOta) {
        await checkGithubUpdate();
      }
    };

    const timer = setTimeout(check, 3000);
    return () => clearTimeout(timer);
  }, [checkOtaUpdate, checkGithubUpdate]);

  const handleApplyOta = async () => {
    if (applying) return;
    setApplying(true);
    try {
      console.log("[AppUpdater] Fetching OTA update...");
      const result = await Updates.fetchUpdateAsync();
      console.log("[AppUpdater] Fetch result:", JSON.stringify(result));
      if (result.isNew) {
        console.log("[AppUpdater] Reloading app with new update...");
        await Updates.reloadAsync();
      } else {
        console.log("[AppUpdater] Update fetched but not new, reloading anyway...");
        await Updates.reloadAsync();
      }
    } catch (e) {
      console.log("[AppUpdater] Error applying OTA update:", e);
      setApplying(false);
    }
  };

  const handleClose = () => {
    setShowUpdate(false);
    setApplying(false);
  };

  if (!showUpdate) return null;

  return (
    <Modal transparent visible={showUpdate} animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/60 justify-center items-center p-6">
        <View className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-purple-600/20 rounded-full items-center justify-center mb-4">
              {updateType === "ota" ? (
                <RefreshCw size={32} color="#a855f7" />
              ) : (
                <Rocket size={32} color="#a855f7" />
              )}
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              {updateType === "ota" ? "Update Ready" : "Update Available"}
            </Text>
            <Text className="text-muted-foreground text-center text-base">
              {updateType === "ota"
                ? "A quick update is ready. No download needed — just restart."
                : "A new version of Mod Panel is ready to install."}
            </Text>
          </View>

          <View className="flex-row justify-between bg-background rounded-2xl p-4 mb-6 border border-border">
            <View>
              <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Current</Text>
              <Text className="text-foreground font-semibold">v{CURRENT_VERSION}</Text>
            </View>
            <View className="items-center justify-center">
              <ArrowRight size={20} color="#71717a" />
            </View>
            <View className="items-end">
              <Text className="text-purple-400 text-xs font-medium uppercase tracking-wider mb-1">New</Text>
              <Text className="text-purple-400 font-bold">
                {updateType === "ota" ? "Latest" : `v${latestVersion}`}
              </Text>
            </View>
          </View>

          <View className="flex-col gap-3">
            {updateType === "ota" ? (
              <TouchableOpacity
                onPress={handleApplyOta}
                disabled={applying}
                className="w-full bg-purple-600 py-4 rounded-xl items-center flex-row justify-center"
                activeOpacity={0.8}
              >
                {applying ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <RefreshCw size={20} color="#ffffff" style={{ marginRight: 8 }} />
                )}
                <Text className="text-white font-bold text-base">
                  {applying ? "Applying..." : "Restart & Update"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => Linking.openURL(downloadUrl)}
                className="w-full bg-purple-600 py-4 rounded-xl items-center flex-row justify-center"
                activeOpacity={0.8}
              >
                <Download size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base">Download Update</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleClose}
              className="w-full py-4 rounded-xl items-center"
              activeOpacity={0.6}
            >
              <Text className="text-muted-foreground font-medium text-base">Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}