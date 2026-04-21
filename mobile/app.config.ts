import { ExpoConfig } from "expo/config";
import pkg from "./package.json";

const config: ExpoConfig = {
  name: "Mod Panel",
  slug: "mod-panel",
  version: pkg.version,
  owner: "jericko",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  scheme: "modpanel",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0a0a0a",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.modpanel.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0a0a0a",
    },
    package: "com.modpanel.app",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-router", "expo-secure-store", "expo-font", "expo-updates"],
  updates: {
    url: "https://u.expo.dev/f3ebfcb1-316e-466f-be4c-358aeb7b3016",
    runtimeVersion: {
      policy: "fingerprint",
    },
  },
  extra: {
    router: {
      origin: false,
    },
    appVersion: pkg.version,
    githubRepo: "ProTechPh/Mod-Panel",
    eas: {
      projectId: "f3ebfcb1-316e-466f-be4c-358aeb7b3016",
    },
  },
};

export default config;