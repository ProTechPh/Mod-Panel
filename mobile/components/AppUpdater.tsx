import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Linking, Platform, ActivityIndicator } from "react-native";
import Constants from "expo-constants";
import pkg from "../package.json";
import { Rocket, ArrowRight, Download } from "lucide-react-native";

const GITHUB_REPO = (Constants.expoConfig?.extra?.githubRepo as string) ?? "";
const CURRENT_VERSION = (Constants.expoConfig?.extra?.appVersion as string) || pkg.version;

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

export function AppUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || !GITHUB_REPO || Platform.OS !== "android") return;
    checked.current = true;

    const checkUpdate = async () => {
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

        // Find the APK asset in the release
        const apkAsset = (release.assets as any[]).find(
          (a: any) => a.name?.endsWith(".apk")
        );
        const url: string = apkAsset?.browser_download_url ?? release.html_url;

        setLatestVersion(version);
        setDownloadUrl(url);
        setShowUpdate(true);
      } catch {
        // Silently ignore network errors
      }
    };

    // Delay check slightly so it doesn't block app startup
    const timer = setTimeout(checkUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!showUpdate) return null;

  return (
    <Modal transparent visible={showUpdate} animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/60 justify-center items-center p-6">
        <View className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-purple-600/20 rounded-full items-center justify-center mb-4">
              <Rocket size={32} color="#a855f7" />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">Update Available</Text>
            <Text className="text-muted-foreground text-center text-base">
              A new version of Mod Panel is ready to install.
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
              <Text className="text-purple-400 font-bold">v{latestVersion}</Text>
            </View>
          </View>

          <View className="flex-col gap-3">
            <TouchableOpacity
              onPress={() => Linking.openURL(downloadUrl)}
              className="w-full bg-purple-600 py-4 rounded-xl items-center flex-row justify-center"
              activeOpacity={0.8}
            >
              <Download size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-base">Download Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowUpdate(false)}
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
