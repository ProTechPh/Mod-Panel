import { useEffect, useRef } from "react";
import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import pkg from "../package.json";

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

export function useAppUpdater() {
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
        const latestVersion = latestTag.replace(/^v/, "");

        if (!latestVersion || !isNewer(latestVersion, CURRENT_VERSION)) return;

        // Find the APK asset in the release
        const apkAsset = (release.assets as any[]).find(
          (a: any) => a.name?.endsWith(".apk")
        );
        const downloadUrl: string =
          apkAsset?.browser_download_url ?? release.html_url;

        Alert.alert(
          "Update Available 🚀",
          `Version ${latestVersion} is available.\nYou have ${CURRENT_VERSION}.`,
          [
            { text: "Later", style: "cancel" },
            {
              text: "Download",
              onPress: () => Linking.openURL(downloadUrl),
            },
          ]
        );
      } catch {
        // Silently ignore network errors
      }
    };

    // Delay check slightly so it doesn't block app startup
    const timer = setTimeout(checkUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);
}
