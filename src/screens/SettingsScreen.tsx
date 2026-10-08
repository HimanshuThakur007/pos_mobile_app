import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { TopAppBar } from "../components/TopAppBar";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { useTheme, ThemeMode } from "../context/ThemeContext";
import {
  getApiBaseUrl,
  setCustomApiUrl,
  getDefaultApiUrl,
} from "../config/api";
import { Globe, Save, RotateCcw, LogOut, Sun, Moon, Monitor } from "lucide-react-native";
import { drawerEvents } from "../utils/drawerEvents";

export const SettingsScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const { theme, isDark, themeMode, setThemeMode, colorScheme } = useTheme();
  const [apiUrl, setApiUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then((url) => setApiUrl(url));
  }, []);

  const handleSaveApiUrl = async () => {
    setSavingUrl(true);
    await setCustomApiUrl(apiUrl);
    setSavingUrl(false);
    if (Platform.OS === "web") {
      alert("API Base URL updated successfully!");
    } else {
      Alert.alert("Settings Updated", "API Base URL has been updated.");
    }
  };

  const handleResetApiUrl = async () => {
    const defaultUrl = getDefaultApiUrl();
    setApiUrl(defaultUrl);
    await setCustomApiUrl(defaultUrl);
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun; subtitle: string }[] = [
    {
      mode: "system",
      label: "System Default",
      icon: Monitor,
      subtitle: `Follow OS settings (${colorScheme || 'light'})`,
    },
    {
      mode: "light",
      label: "Light Theme",
      icon: Sun,
      subtitle: "Always light appearance",
    },
    {
      mode: "dark",
      label: "Dark Theme",
      icon: Moon,
      subtitle: "Facebook style dark appearance",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <TopAppBar
        title="Settings"
        subtitle="App & Connection Configuration"
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Account Profile */}
        <Card>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
            User Account Profile
          </Text>
          <View style={styles.profileBox}>
            <View style={styles.avatarBig}>
              <Text style={styles.avatarBigText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]}>
                {user?.name || "Authorized User"}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
                {user?.email || "user@company.com"}
              </Text>
              <View style={{ marginTop: 6 }}>
                <Badge label={user?.role || "ADMIN"} variant="info" showDot />
              </View>
            </View>
          </View>
        </Card>

        {/* Appearance & Theme Selection */}
        <Card>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
            Appearance & Theme
          </Text>
          <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
            Choose your preferred theme display mode. Currently active:{" "}
            <Text style={{ fontWeight: "700", color: theme.primary }}>
              {isDark ? "Dark Theme" : "Light Theme"}
            </Text>
          </Text>

          <View style={styles.themeOptionsGrid}>
            {themeOptions.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = themeMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.themeOptionCard,
                    {
                      backgroundColor: isSelected
                        ? theme.primaryLight
                        : theme.subtleBoxBg,
                      borderColor: isSelected
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                  onPress={() => setThemeMode(opt.mode)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themeOptionHeader}>
                    <IconComp
                      size={20}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                    {isSelected && (
                      <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      {
                        color: isSelected ? theme.primary : theme.textPrimary,
                        fontWeight: isSelected ? "700" : "600",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[styles.themeOptionSub, { color: theme.textMuted }]}
                  >
                    {opt.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Backend API Configuration */}
        <Card>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
            Backend Server Endpoint
          </Text>
          <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
            Configure the connection URL for your Node.js backend server.
          </Text>

          <Input
            label="API Base URL"
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://10.0.2.2:5000/api"
            autoCapitalize="none"
            icon={Globe}
          />

          <View style={styles.buttonRow}>
            <Button
              title="Save URL"
              onPress={handleSaveApiUrl}
              loading={savingUrl}
              icon={Save}
              style={{ flex: 1 }}
            />
            <Button
              title="Reset Default"
              variant="outline"
              onPress={handleResetApiUrl}
              icon={RotateCcw}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Device & Environment Context */}
        <Card>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
            Cross-Platform Diagnostics
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: theme.textSecondary }]}>
              Platform OS
            </Text>
            <Badge
              label={Platform.OS.toUpperCase()}
              variant="success"
              showDot
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: theme.textSecondary }]}>
              Runtime Engine
            </Text>
            <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
              React Native 0.86 / Expo 57
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: theme.textSecondary }]}>
              System Color Scheme
            </Text>
            <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
              {colorScheme ? colorScheme.toUpperCase() : "LIGHT"}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: theme.textSecondary }]}>
              Default Host Mapping
            </Text>
            <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
              {Platform.OS === "android"
                ? "10.0.2.2 (Android Emulator)"
                : "localhost"}
            </Text>
          </View>
        </Card>

        {/* Logout */}
        <Button
          title="Sign Out of Mobile App"
          variant="danger"
          onPress={logout}
          icon={LogOut}
          style={styles.logoutButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160,
    width: "100%",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  infoSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  profileBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBig: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1877f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarBigText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "800",
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  themeOptionsGrid: {
    gap: 8,
    marginTop: 4,
  },
  themeOptionCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  themeOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeOptionLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  themeOptionSub: {
    fontSize: 11,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoKey: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
});

