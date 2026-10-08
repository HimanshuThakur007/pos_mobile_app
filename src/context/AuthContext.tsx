import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  getAccessToken,
  getStoredUser,
  setAuthTokens,
  setStoredUser,
  clearAuthTokens,
  setOnSessionExpiredCallback,
  triggerSessionExpired,
  ensureValidToken,
} from "../api/apiClient";

import { getApiBaseUrl } from "../config/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    userUid: string,
    password?: string,
    fyCode?: string,
    deviceUid?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Register global listener for 401 / Session Expired API triggers
    setOnSessionExpiredCallback(() => {
      setUser(null);
    });

    const initializeAuth = async () => {
      try {
        const token = await getAccessToken();
        const storedUser = await getStoredUser();

        if (token && storedUser) {
          setUser(storedUser);
          // Verify session token validity on app launch
          try {
            const validToken = await ensureValidToken();
            if (!validToken) {
              await triggerSessionExpired();
            }
          } catch (tokErr) {
            console.warn("Token validation failed on startup:", tokErr);
            await triggerSessionExpired();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        await triggerSessionExpired();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      setOnSessionExpiredCallback(null);
    };
  }, []);

  const login = async (
    userUid: string,
    password?: string,
    fyCode?: string,
    deviceUid?: string,
  ) => {
    setIsLoading(true);
    try {
      const baseUrl = await getApiBaseUrl();
      const apiBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const url = `${apiBaseUrl}/login`;

      console.log("Sending Direct Login Request to:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          user_uid: userUid.trim(),
          password: password || "",
          fy_code: fyCode || "20262027",
          device_uid: deviceUid || "MOBILE_APP_DEVICE",
          force_terminate: false,
        }),
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        throw new Error(
          `Server returned invalid response (HTTP ${response.status}).`,
        );
      }

      if (!response.ok) {
        const errorMsg =
          data?.message ||
          data?.error ||
          `Login failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      const payload = data.data || data;
      console.log("Direct Login API Response Payload:", payload);

      const token =
        payload.token ||
        payload.access_token ||
        payload.accessToken ||
        data.token ||
        data.access_token ||
        data.accessToken;

      if (!token) {
        throw new Error(
          data.message ||
            data.error ||
            "Login failed. Invalid credentials or missing token.",
        );
      }

      const userObj = payload.user || payload.user_info || {};

      const loggedInUser: User = {
        id: String(userObj.id || `usr-${Date.now()}`),
        name: userObj.name || userUid,
        user_uid: userObj.user_uid || userUid,
        email: userObj.email || `${userUid}@market99pos.com`,
        role:
          userObj.role?.name ||
          (typeof userObj.role === "string" ? userObj.role : "ADMIN"),
        branchCode:
          userObj.branch?.branch_code || userObj.branch_code || "5010",
        branchName:
          userObj.branch?.branch_name ||
          userObj.branch_name ||
          "Flagship Store",
        fyCode: payload.fy_code || fyCode || "20262027",
      };

      const refreshToken =
        payload.refreshToken ||
        payload.refresh_token ||
        data.refreshToken ||
        data.refresh_token;

      await setAuthTokens(token, refreshToken);
      await setStoredUser(loggedInUser);
      setUser(loggedInUser);
    } catch (err: any) {
      console.error("Market99 POS Login Error:", err.message || err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const deviceUid = "MOBILE_APP_DEVICE";

      if (token) {
        try {
          const baseUrl = await getApiBaseUrl();
          let apiBaseUrl = baseUrl.endsWith("/")
            ? baseUrl.slice(0, -1)
            : baseUrl;

          console.log("Sending Logout Request to:", `${apiBaseUrl}/logout`);
          const response = await fetch(`${apiBaseUrl}/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-Device-UID": deviceUid,
            },
            body: JSON.stringify({
              device_uid: deviceUid,
            }),
          });

          const responseData = await response.json().catch(() => null);
          console.log("Central Logout API Response:", {
            status: response.status,
            ok: response.ok,
            data: responseData,
          });
        } catch (e) {
          console.error("Central logout API failed:", e);
        }
      }
    } finally {
      await clearAuthTokens();
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
