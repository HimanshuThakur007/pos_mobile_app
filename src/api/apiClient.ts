import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "../config/api";

const ACCESS_TOKEN_KEY = "@access_token";
const REFRESH_TOKEN_KEY = "@refresh_token";
const AUTH_USER_KEY = "@auth_user";

export interface User {
  id: string;
  name: string;
  user_uid?: string;
  email: string;
  role: string;
  avatarUrl?: string;
  status?: string;
  branchCode?: string;
  branchName?: string;
  fyCode?: string;
}

type SessionExpiredCallback = () => void;
let onSessionExpiredCallback: SessionExpiredCallback | null = null;

export function setOnSessionExpiredCallback(cb: SessionExpiredCallback | null) {
  onSessionExpiredCallback = cb;
}

export async function triggerSessionExpired() {
  await clearAuthTokens();
  if (onSessionExpiredCallback) {
    onSessionExpiredCallback();
  }
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setAuthTokens(
  accessToken: string,
  refreshToken?: string,
): Promise<void> {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function setStoredUser(user: User): Promise<void> {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<User | null> {
  const userStr = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(AUTH_USER_KEY),
  ]);
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let str = "";
    for (let i = 0; i < base64.length; i += 4) {
      const a = chars.indexOf(base64.charAt(i));
      const b = chars.indexOf(base64.charAt(i + 1));
      const c = chars.indexOf(base64.charAt(i + 2));
      const d = chars.indexOf(base64.charAt(i + 3));
      str += String.fromCharCode((a << 2) | (b >> 4));
      if (c !== 64) str += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      if (d !== 64) str += String.fromCharCode(((c & 3) << 6) | d);
    }
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + 30;
}

let refreshTokenPromise: Promise<string | null> | null = null;

export async function refreshAuthToken(): Promise<string | null> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    const refreshTokenStr = await getRefreshToken();
    if (!refreshTokenStr) return null;

    try {
      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: refreshTokenStr,
          refresh_token: refreshTokenStr,
        }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 400) {
          console.warn(`Token refresh rejected by server with HTTP ${res.status}`);
          await triggerSessionExpired();
        }
        return null;
      }

      const responseText = await res.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        return null;
      }

      const payload = data.data || data;
      const newToken =
        payload.accessToken ||
        payload.access_token ||
        payload.token ||
        data.accessToken ||
        data.access_token ||
        data.token;

      if (newToken) {
        const newRefreshToken =
          payload.refreshToken ||
          payload.refresh_token ||
          data.refreshToken ||
          data.refresh_token;

        await setAuthTokens(newToken, newRefreshToken);
        return newToken;
      }

      await triggerSessionExpired();
      return null;
    } catch (err) {
      console.error("Failed to refresh token on mobile (network/timeout):", err);
      return null;
    }
  })();

  try {
    return await refreshTokenPromise;
  } finally {
    refreshTokenPromise = null;
  }
}

export async function ensureValidToken(): Promise<string | null> {
  let token = await getAccessToken();
  if (token && !isTokenExpired(token)) {
    return token;
  }

  token = await refreshAuthToken();
  return token;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false,
): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const isPublicEndpoint =
    cleanEndpoint.includes("/login") ||
    cleanEndpoint.includes("/auth/login") ||
    cleanEndpoint.includes("/auth/refresh") ||
    cleanEndpoint.includes("/fin-years");

  if (!isPublicEndpoint) {
    await ensureValidToken();
  }

  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (
      response.status === 401 &&
      !isRetry &&
      !isPublicEndpoint
    ) {
      const newToken = await refreshAuthToken();
      if (newToken) {
        return apiRequest<T>(endpoint, options, true);
      }
      await triggerSessionExpired();
      throw new Error("Session expired. Please log in again.");
    }

    const responseText = await response.text();
    let data: any;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseErr) {
      if (!response.ok) {
        if (response.status === 401 && !isPublicEndpoint) {
          await triggerSessionExpired();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`API server error (HTTP ${response.status}). Please check network or endpoint.`);
      }
      throw new Error(`Server returned invalid non-JSON response (HTTP ${response.status}).`);
    }

    // Check for 401 / Session Expired payloads returned even with HTTP 200 or non-OK statuses
    if (
      !isPublicEndpoint &&
      data &&
      typeof data === "object" &&
      (data.status === 401 ||
        data.code === 401 ||
        data.message === "Unauthenticated." ||
        data.message === "Unauthenticated" ||
        data.error === "Unauthenticated." ||
        (typeof data.message === "string" && data.message.toLowerCase().includes("session expired")) ||
        (typeof data.error === "string" && data.error.toLowerCase().includes("session expired")) ||
        (typeof data.message === "string" && data.message.toLowerCase().includes("token expired")) ||
        (typeof data.error === "string" && data.error.toLowerCase().includes("token expired")))
    ) {
      await triggerSessionExpired();
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      if (response.status === 401 && !isPublicEndpoint) {
        await triggerSessionExpired();
        throw new Error("Session expired. Please log in again.");
      }
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data?.errors === "object" ? JSON.stringify(data.errors) : null) ||
        `API request failed with status ${response.status}`;
      throw new Error(`[HTTP ${response.status}] ${serverMsg}`);
    }

    return data;
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    if (rawMsg.includes("Session expired")) {
      throw err;
    }
    if (
      rawMsg.includes('Failed to fetch') ||
      rawMsg.includes('Network request failed') ||
      err?.name === 'TypeError'
    ) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    throw new Error(
      err.message || 'Network request failed. Please check your internet connection.',
    );
  }
}

export async function fetchSalesReportData(): Promise<any> {
  try {
    const res = await apiRequest<any>('/analytics/sales-reports');
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn('API sales reports fetch fallback to local data:', err);
  }
  return null;
}
