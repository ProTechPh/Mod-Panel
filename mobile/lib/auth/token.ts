import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "wp_access";
const REFRESH_TOKEN_KEY = "wp_refresh";
const ACCESS_COOKIE_KEY = "wp_access_cookie";
const REFRESH_COOKIE_KEY = "wp_refresh_cookie";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

/** Store the raw cookie values for manual Cookie header injection */
export async function saveCookieValues(accessCookie: string, refreshCookie: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_COOKIE_KEY, accessCookie);
  await SecureStore.setItemAsync(REFRESH_COOKIE_KEY, refreshCookie);
}

export async function getCookieHeader(): Promise<string | null> {
  const access = await SecureStore.getItemAsync(ACCESS_COOKIE_KEY);
  const refresh = await SecureStore.getItemAsync(REFRESH_COOKIE_KEY);
  if (!access && !refresh) return null;
  const parts: string[] = [];
  if (access) parts.push(`wp_access=${access}`);
  if (refresh) parts.push(`wp_refresh=${refresh}`);
  return parts.join("; ");
}

export async function updateAccessCookie(accessToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_COOKIE_KEY, accessToken);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(ACCESS_COOKIE_KEY);
  await SecureStore.deleteItemAsync(REFRESH_COOKIE_KEY);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await setAccessToken(access);
  await setRefreshToken(refresh);
}