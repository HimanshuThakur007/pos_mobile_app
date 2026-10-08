import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { getDefaultApiUrl } from "../config/api";
import { apiRequest } from "../api/apiClient";
import { User, Lock, ShieldCheck, Calendar } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

interface FinancialYear {
  id: string;
  fy_code: string;
  label: string;
  start_date?: string;
  end_date?: string;
  is_active?: number;
}

const DEFAULT_FIN_YEARS: FinancialYear[] = [
  { id: "7", fy_code: "20262027", label: "FY 2026-27", is_active: 1 },
  { id: "1", fy_code: "20252026", label: "FY 2025-26", is_active: 0 },
  { id: "2", fy_code: "20242025", label: "FY 2024-25", is_active: 0 },
  { id: "3", fy_code: "20232024", label: "FY 2023-24", is_active: 0 },
];

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  const [userUid, setUserUid] = useState("");
  const [password, setPassword] = useState("");
  const [fyCode, setFyCode] = useState("20262027");
  const [finYears, setFinYears] = useState<FinancialYear[]>(DEFAULT_FIN_YEARS);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      const fetchFinancialYears = async () => {
        try {
          const response = await apiRequest<any>("/fin-years");
          const data = Array.isArray(response) ? response : response?.data;
          if (data && Array.isArray(data) && data.length > 0) {
            setFinYears(data);
            const activeFY =
              data.find((fy: FinancialYear) => fy.is_active === 1) || data[0];
            if (activeFY?.fy_code) setFyCode(activeFY.fy_code);
          }
        } catch {
          // Silent fallback
        }
      };
      fetchFinancialYears();
    }
  }, []);

  const activeYears = finYears.filter((fy) => fy.is_active === 1);
  const displayedYears = activeYears.length > 0 ? activeYears : finYears.slice(0, 2);

  const handleLogin = async () => {
    if (!userUid.trim() || !password.trim()) {
      setError("User UID and Password are required.");
      Alert.alert("Input Required", "Please enter both User UID and Password.");
      return;
    }
    setError("");
    try {
      await login(userUid, password, fyCode);
    } catch (err: any) {
      const msg = err?.message || String(err) || "Market99 POS Authentication Failed.";
      setError(msg);
      Alert.alert("Login Failed", msg);
    }
  };

  const platformName =
    Platform.OS === "android" ? "Android" : Platform.OS === "ios" ? "iOS" : "Web / Desktop";

  // Dynamic colours
  const cardBg = theme.cardBg;
  const cardBorder = theme.cardBorder;
  const textPrimary = theme.textPrimary;
  const textSecondary = theme.textSecondary;
  const divider = theme.divider;
  const subtleBg = theme.subtleBoxBg;
  const primary = theme.primary;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>

          {/* ── Brand Header ── */}
          <View style={styles.headerBox}>
            {/* Logo badge */}
            <View style={[styles.logoBadge, {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              shadowColor: isDark ? "#000" : "#0f172a",
            }]}>
              <Image
                source={require("../../assets/logo1.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appTitle, { color: textPrimary }]}>M99 Insight</Text>
            <Text style={[styles.appSubtitle, { color: textSecondary }]}>
              Retail Enterprise Terminal · {platformName}
            </Text>
            {/* Divider accent line */}
            <View style={[styles.headerAccentLine, { backgroundColor: primary }]} />
          </View>

          {/* ── Login Card ── */}
          <View style={[styles.loginCard, {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            shadowColor: isDark ? "#000" : "#0f172a",
          }]}>

            {/* Card top accent band */}
            <View style={[styles.cardTopBand, { backgroundColor: primary }]} />

            <View style={styles.cardInner}>
              {/* Card header */}
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>Account Sign In</Text>
                  <Text style={[styles.cardSub, { color: textSecondary }]}>
                    Market99 POS terminal credentials
                  </Text>
                </View>
                <View style={[styles.secureBadge, {
                  backgroundColor: isDark ? "#064e3b" : "#ecfdf5",
                  borderColor: isDark ? "#047857" : "#a7f3d0",
                }]}>
                  <ShieldCheck size={12} color={isDark ? "#6ee7b7" : "#16a34a"} style={{ marginRight: 3 }} />
                  <Text style={[styles.secureBadgeText, { color: isDark ? "#6ee7b7" : "#047857" }]}>
                    SSL 256-Bit
                  </Text>
                </View>
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: divider }]} />

              {/* Error banner */}
              {error ? (
                <View style={[styles.errorBanner, {
                  backgroundColor: isDark ? "#7f1d1d" : "#fef2f2",
                  borderColor: isDark ? "#b91c1c" : "#fca5a5",
                }]}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.errorBannerHeader, { color: isDark ? "#fca5a5" : "#991b1b" }]}>
                      Authentication Error:
                    </Text>
                    <Text style={[styles.errorText, { color: isDark ? "#fca5a5" : "#b91c1c" }]} selectable>
                      {error}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Inputs */}
              <Input
                label="User UID"
                placeholder="Enter your User UID"
                value={userUid}
                onChangeText={setUserUid}
                autoCapitalize="none"
                icon={User}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                icon={Lock}
                rightElement={
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeText}>{showPassword ? "👁️" : "🙈"}</Text>
                  </TouchableOpacity>
                }
              />

              {/* Financial Year */}
              <View style={styles.fyHeaderRow}>
                <View style={styles.fyLabelRow}>
                  <Calendar size={13} color={textSecondary} />
                  <Text style={[styles.inputLabel, { color: textPrimary }]}>Financial Year</Text>
                </View>
                <View style={[styles.activeDotPill, {
                  backgroundColor: isDark ? "#064e3b" : "#f0fdf4",
                }]}>
                  <View style={styles.greenDot} />
                  <Text style={[styles.activeDotText, { color: isDark ? "#6ee7b7" : "#15803d" }]}>
                    Active Session
                  </Text>
                </View>
              </View>

              <View style={styles.fyRow}>
                {displayedYears.map((fy) => {
                  const isSelected = fyCode === fy.fy_code;
                  return (
                    <TouchableOpacity
                      key={fy.fy_code}
                      style={[
                        styles.fyChip,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? "#1e3a8a" : "#eff6ff")
                            : subtleBg,
                          borderColor: isSelected
                            ? (isDark ? "#3b82f6" : "#2563eb")
                            : cardBorder,
                        },
                      ]}
                      onPress={() => setFyCode(fy.fy_code)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fyChipHeader}>
                        <Text style={[
                          styles.fyChipText,
                          { color: isSelected ? (isDark ? "#93c5fd" : "#2563eb") : textPrimary },
                        ]}>
                          {fy.label}
                        </Text>
                        {fy.is_active === 1 && (
                          <View style={[styles.activeTag, { backgroundColor: isDark ? "#1d4ed8" : "#2563eb" }]}>
                            <Text style={styles.activeTagText}>Current</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.fyCodeSub,
                        { color: isSelected ? (isDark ? "#60a5fa" : "#1d4ed8") : textSecondary },
                      ]}>
                        Code: {fy.fy_code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                title="Authenticate & Launch Terminal"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.signInButton}
              />
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Gateway: {getDefaultApiUrl()}
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    minHeight: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    maxWidth: 460,
    width: "100%",
  },

  // ── Header ──
  headerBox: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    padding: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  logoImage: { width: "100%", height: "100%" },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  headerAccentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 14,
  },

  // ── Login Card ──
  loginCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTopBand: {
    height: 4,
    width: "100%",
  },
  cardInner: {
    padding: 24,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  cardSub: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: "500",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  sectionDivider: {
    height: 1,
    marginBottom: 20,
  },

  // ── Error banner ──
  errorBanner: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorIcon: { fontSize: 16, marginRight: 4 },
  errorBannerHeader: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },

  // ── Password eye ──
  eyeBtn: {
    padding: 6,
    marginLeft: 4,
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web" && { cursor: "pointer" } as any),
  },
  eyeText: { fontSize: 16 },

  // ── FY section ──
  fyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 10,
  },
  fyLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  activeDotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16a34a",
  },
  activeDotText: {
    fontSize: 10,
    fontWeight: "700",
  },
  fyRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  fyChip: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    ...(Platform.OS === "web" && { cursor: "pointer" } as any),
  },
  fyChipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  fyChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  activeTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeTagText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },
  fyCodeSub: {
    fontSize: 11,
    fontWeight: "500",
  },

  // ── Sign-in button ──
  signInButton: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
  },

  // ── Footer ──
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
});

