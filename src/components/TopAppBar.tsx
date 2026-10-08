import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useGlobalFilter } from "../context/GlobalFilterContext";
import { Filter } from "lucide-react-native";

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onOpenDrawer: () => void;
  onOpenFilter?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  onOpenDrawer,
  onOpenFilter,
}) => {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { openFilterModal } = useGlobalFilter();

  const handleFilterPress = onOpenFilter || openFilterModal;

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
      {/* Header Bar */}
      <View style={styles.topRow}>
        {/* Left Side: M_LOGO Image & Page Title */}
        <View style={styles.leftRow}>
          <Image
            source={require("../../assets/logo1.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.titleBox}>
            <Text style={[styles.titleText, { color: theme.textPrimary }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right Side: Global Filter Button & User Drawer Avatar */}
        <View style={styles.rightRow}>
          <TouchableOpacity
            style={[
              styles.circularBtn,
              { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={handleFilterPress}
            activeOpacity={0.8}
            accessibilityLabel="Filter Reports"
          >
            <Filter size={17} color="#ffffff" />
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              style={[styles.avatarRing, { borderColor: theme.primary }]}
              onPress={onOpenDrawer}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarInner, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "web" ? 12 : Platform.OS === "ios" ? 48 : 38,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoImage: {
    width: 38,
    height: 38,
    marginRight: 10,
  },
  titleBox: {
    flex: 1,
  },
  titleText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
    fontWeight: "500",
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circularBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#2563eb",
    padding: 2,
    marginLeft: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
  },
});
