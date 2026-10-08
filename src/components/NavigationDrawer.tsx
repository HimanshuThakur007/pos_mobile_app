import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Badge } from "./Badge";
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  ChevronsUpDown,
  Search,
  Sparkles,
} from "lucide-react-native";

import { drawerEvents } from "../utils/drawerEvents";
import {
  fetchSidebarMenu,
  SidebarMenuData,
  SidebarMenuGroup,
  SidebarMenuItem,
} from "../api/sidebarApi";
import { getSidebarIcon } from "../utils/sidebarIconMapper";

if (
  Platform.OS === "android" &&
  !(globalThis as any).nativeFabricUIManager &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface NavigationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screenName: string) => void;
  activeScreen?: string;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  visible,
  onClose,
  onNavigate,
  activeScreen = "POSSales",
}) => {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [menuData, setMenuData] = useState<SidebarMenuData>({
    menuGroups: [],
    standaloneItems: [],
  });

  // State to track expanded category groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      overview: true,
      store_analytics: false,
      financials: false,
      audits: false,
    }
  );

  // Load sidebar menu structure from API / JSON source
  useEffect(() => {
    let isMounted = true;
    fetchSidebarMenu().then((data) => {
      if (isMounted) {
        setMenuData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const menuGroups = menuData.menuGroups;
  const standaloneItems = menuData.standaloneItems;

  // Auto-expand group that contains activeScreen when sidebar opens & reset search
  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      if (activeScreen && menuGroups.length > 0) {
        const parentGroup = menuGroups.find((group) =>
          group.items.some((item) => item.name === activeScreen)
        );
        if (parentGroup) {
          setExpandedGroups((prev) => ({
            ...prev,
            [parentGroup.id]: true,
          }));
        }
      }
    }
  }, [visible, activeScreen, menuGroups]);

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return menuGroups;
    const q = searchQuery.toLowerCase().trim();
    return menuGroups
      .map((group) => {
        const matchingItems = group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q)
        );
        if (matchingItems.length > 0) {
          return { ...group, items: matchingItems };
        }
        return null;
      })
      .filter(Boolean) as SidebarMenuGroup[];
  }, [menuGroups, searchQuery]);

  const filteredStandalone = useMemo(() => {
    if (!searchQuery.trim()) return standaloneItems;
    const q = searchQuery.toLowerCase().trim();
    return standaloneItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
  }, [standaloneItems, searchQuery]);

  // Auto-expand matching groups when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const autoExpand: Record<string, boolean> = {};
      filteredGroups.forEach((g) => {
        autoExpand[g.id] = true;
      });
      setExpandedGroups((prev) => ({ ...prev, ...autoExpand }));
    }
  }, [searchQuery, filteredGroups]);

  const toggleGroup = (groupId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleAllGroups = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const areAllExpanded = filteredGroups.every((g) => expandedGroups[g.id]);
    const newState: Record<string, boolean> = {};
    filteredGroups.forEach((g) => {
      newState[g.id] = !areAllExpanded;
    });
    setExpandedGroups(newState);
  };

  const handleClose = () => {
    drawerEvents.closeDrawer();
    onClose();
  };

  const handleSelect = (name: string) => {
    handleClose();
    onNavigate(name);
  };

  const totalResultsCount =
    filteredGroups.reduce((acc, g) => acc + g.items.length, 0) +
    filteredStandalone.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Click outside drawer to close automatically */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[styles.drawerContainer, { backgroundColor: theme.cardBg }]}
        >
          {/* Compact Header section with top safe area */}
          <View
            style={[
              styles.headerSection,
              { paddingTop: Math.max(insets.top + 10, 24) },
            ]}
          >
            {/* User Profile Header + X Close Button */}
            <View
              style={[
                styles.profileHeader,
                { borderBottomColor: theme.divider },
              ]}
            >
              <View
                style={[styles.avatarBig, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.avatarBigText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text
                    style={[styles.userName, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {user?.name || "Authorized User"}
                  </Text>
                  <Badge label={user?.role || "ADMIN"} variant="info" showDot />
                </View>
                <Text
                  style={[styles.userEmail, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {user?.email || "user@company.com"}
                </Text>
              </View>

              {/* Action Buttons: Close X */}
              <TouchableOpacity
                style={[
                  styles.actionBtnHeader,
                  { backgroundColor: isDark ? "#3a3b3c" : "#f0f2f5" },
                ]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick Search Bar */}
            <View
              style={[
                styles.searchBoxContainer,
                {
                  backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                  borderColor: theme.border,
                },
              ]}
            >
              <Search size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search modules & screens..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && Platform.OS !== "ios" && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={14} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Navigation title + Expand All / Collapse All button */}
            <View style={styles.sectionHeaderContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
                {searchQuery
                  ? `RESULTS (${totalResultsCount})`
                  : "NAVIGATION MODULES"}
              </Text>
              {filteredGroups.length > 0 && !searchQuery && (
                <TouchableOpacity
                  onPress={toggleAllGroups}
                  style={styles.toggleAllBtn}
                  activeOpacity={0.7}
                >
                  <ChevronsUpDown size={13} color={theme.primary} />
                  <Text style={[styles.toggleAllText, { color: theme.primary }]}>
                    {filteredGroups.every((g) => expandedGroups[g.id])
                      ? "Collapse All"
                      : "Expand All"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Scrollable Navigation Menu List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.menuList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Empty Search Result State */}
            {totalResultsCount === 0 && (
              <View style={styles.emptyStateContainer}>
                <Search size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
                  No screens found
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.textMuted }]}>
                  No matching module found for "{searchQuery}"
                </Text>
                <TouchableOpacity
                  style={[styles.clearSearchBtn, { backgroundColor: theme.primaryLight }]}
                  onPress={() => setSearchQuery("")}
                >
                  <Text style={[styles.clearSearchText, { color: theme.primary }]}>
                    Clear Search
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Nested Categories / Groups */}
            {filteredGroups.map((group) => {
              const isExpanded = !!expandedGroups[group.id];
              const GroupIcon = getSidebarIcon(group.icon);
              const activeChild = group.items.find(
                (item) => item.name === activeScreen
              );
              const hasActiveChild = !!activeChild;

              return (
                <View key={group.id} style={styles.groupContainer}>
                  {/* Category / Group Header */}
                  <TouchableOpacity
                    style={[
                      styles.groupHeader,
                      {
                        backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                        borderColor: hasActiveChild
                          ? theme.primary
                          : theme.border,
                      },
                      hasActiveChild && {
                        backgroundColor: isDark ? "#1e2d42" : "#eff6ff",
                      },
                    ]}
                    onPress={() => toggleGroup(group.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.groupIconBox,
                        {
                          backgroundColor: isDark ? "#334155" : "#e2e8f0",
                        },
                        hasActiveChild && {
                          backgroundColor: theme.primaryLight,
                        },
                      ]}
                    >
                      <GroupIcon
                        size={17}
                        color={
                          hasActiveChild ? theme.primary : theme.textSecondary
                        }
                        strokeWidth={hasActiveChild ? 2.5 : 2}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={[
                            styles.groupTitle,
                            { color: theme.textPrimary },
                            hasActiveChild && {
                              color: theme.primary,
                              fontWeight: "800",
                            },
                          ]}
                        >
                          {group.title}
                        </Text>
                        <View
                          style={[
                            styles.countBadge,
                            {
                              backgroundColor: isDark ? "#334155" : "#cbd5e1",
                            },
                            hasActiveChild && {
                              backgroundColor: theme.primary,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.countBadgeText,
                              hasActiveChild && { color: "#ffffff" },
                            ]}
                          >
                            {group.items.length}
                          </Text>
                        </View>
                      </View>

                      {/* Active Item Preview badge when collapsed */}
                      {!isExpanded && hasActiveChild ? (
                        <View style={styles.activePreviewRow}>
                          <Sparkles size={11} color={theme.primary} />
                          <Text
                            style={[
                              styles.activePreviewText,
                              { color: theme.primary },
                            ]}
                            numberOfLines={1}
                          >
                            Active: {activeChild?.label}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.groupSubtitle,
                            { color: theme.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {group.subtitle}
                        </Text>
                      )}
                    </View>

                    {/* Expand/Collapse Chevron (Parents Only) */}
                    <View style={styles.expandChevronBox}>
                      {isExpanded ? (
                        <ChevronDown
                          size={18}
                          color={hasActiveChild ? theme.primary : theme.textMuted}
                        />
                      ) : (
                        <ChevronRight
                          size={18}
                          color={hasActiveChild ? theme.primary : theme.textMuted}
                        />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Nested Sub-Items List */}
                  {isExpanded && (
                    <View style={styles.nestedItemsContainer}>
                      {/* Left vertical guide line for tree visual effect */}
                      <View
                        style={[
                          styles.treeLine,
                          {
                            backgroundColor: isDark ? "#334155" : "#cbd5e1",
                          },
                        ]}
                      />

                      <View style={styles.subItemsList}>
                        {group.items.map((item) => {
                          const isActive = activeScreen === item.name;
                          const ItemIcon = getSidebarIcon(item.icon);

                          return (
                            <TouchableOpacity
                              key={item.name}
                              style={[
                                styles.subMenuItem,
                                {
                                  backgroundColor: isDark
                                    ? "#1a2234"
                                    : "#ffffff",
                                  borderColor: theme.border,
                                },
                                isActive && {
                                  backgroundColor: isDark
                                    ? "#1e293b"
                                    : "#eff6ff",
                                  borderColor: theme.primary,
                                  borderLeftWidth: 3.5,
                                  borderLeftColor: theme.primary,
                                },
                              ]}
                              onPress={() => handleSelect(item.name)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.subIconBox,
                                  {
                                    backgroundColor: isDark
                                      ? "#334155"
                                      : "#f1f5f9",
                                  },
                                  isActive && {
                                    backgroundColor: theme.primaryLight,
                                  },
                                ]}
                              >
                                <ItemIcon
                                  size={16}
                                  color={
                                    isActive
                                      ? theme.primary
                                      : theme.textSecondary
                                  }
                                  strokeWidth={isActive ? 2.5 : 2}
                                />
                              </View>

                              <View style={{ flex: 1 }}>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.subMenuLabel,
                                      { color: theme.textPrimary },
                                      isActive && {
                                        color: theme.primary,
                                        fontWeight: "800",
                                      },
                                    ]}
                                  >
                                    {item.label}
                                  </Text>
                                  {isActive && (
                                    <View
                                      style={[
                                        styles.activeDot,
                                        { backgroundColor: theme.primary },
                                      ]}
                                    />
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.subMenuSubtitle,
                                    { color: theme.textMuted },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.subtitle}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* System / Standalone Top-Level Items */}
            {filteredStandalone.length > 0 && (
              <View style={styles.standaloneSection}>
                <Text
                  style={[styles.sectionHeader, { color: theme.textMuted }]}
                >
                  PREFERENCES
                </Text>
                {filteredStandalone.map((item) => {
                  const isActive = activeScreen === item.name;
                  const ItemIcon = getSidebarIcon(item.icon);

                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.standaloneMenuItem,
                        {
                          backgroundColor: isDark ? "#242526" : "#ffffff",
                          borderColor: theme.border,
                        },
                        isActive && {
                          backgroundColor: isDark ? "#1e293b" : "#eff6ff",
                          borderColor: theme.primary,
                          borderLeftWidth: 3.5,
                          borderLeftColor: theme.primary,
                        },
                      ]}
                      onPress={() => handleSelect(item.name)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: isDark ? "#3a3b3c" : "#f8fafc",
                          },
                          isActive && {
                            backgroundColor: theme.primaryLight,
                          },
                        ]}
                      >
                        <ItemIcon
                          size={18}
                          color={
                            isActive ? theme.primary : theme.textSecondary
                          }
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.menuLabel,
                            { color: theme.textPrimary },
                            isActive && {
                              color: theme.primary,
                              fontWeight: "800",
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.menuSubtitle,
                            { color: theme.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {item.subtitle}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer Section with safe area bottom inset + App Meta */}
          <View
            style={[
              styles.drawerFooter,
              {
                backgroundColor: theme.cardBg,
                borderTopColor: theme.divider,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            <View style={styles.appMetaRow}>
              <Text style={[styles.appVersionText, { color: theme.textMuted }]}>
                v1.4.2 • Enterprise POS Sync
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.fixedSignOutButton,
                {
                  backgroundColor: isDark ? "#3f1a1d" : "#fff1f2",
                  borderColor: isDark ? "#7f1d1d" : "#fecdd3",
                },
              ]}
              onPress={() => {
                handleClose();
                logout();
              }}
              activeOpacity={0.8}
            >
              <LogOut size={16} color="#e41e3f" style={{ marginRight: 8 }} />
              <Text style={styles.signOutText}>Sign Out Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flexDirection: "row",
  },
  drawerContainer: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    height: "100%",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    shadowColor: "#0f172a",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    display: "flex",
    flexDirection: "column",
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 8,
  },
  actionBtnHeader: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBig: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarBigText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  userName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
  },
  userEmail: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  searchBoxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    paddingVertical: 0,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  toggleAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  toggleAllText: {
    fontSize: 11,
    fontWeight: "600",
  },
  menuList: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 16,
    paddingTop: 4,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  clearSearchBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: "700",
  },
  groupContainer: {
    marginBottom: 2,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  groupIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  groupTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1e293b",
  },
  groupSubtitle: {
    fontSize: 10.5,
    color: "#64748b",
    marginTop: 1,
  },
  activePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  activePreviewText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: "#cbd5e1",
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#334155",
  },
  expandChevronBox: {
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  nestedItemsContainer: {
    flexDirection: "row",
    marginTop: 6,
    paddingLeft: 12,
  },
  treeLine: {
    width: 2,
    borderRadius: 1,
    backgroundColor: "#cbd5e1",
    marginRight: 10,
    marginVertical: 4,
  },
  subItemsList: {
    flex: 1,
    gap: 6,
  },
  subMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  subIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  subMenuLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#334155",
  },
  subMenuSubtitle: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  standaloneSection: {
    marginTop: 6,
    gap: 8,
  },
  standaloneMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#334155",
  },
  menuSubtitle: {
    fontSize: 10.5,
    color: "#94a3b8",
    marginTop: 1,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  appMetaRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  appVersionText: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  fixedSignOutButton: {
    flexDirection: "row",
    height: 44,
    backgroundColor: "#fff1f2",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  signOutText: {
    color: "#e41e3f",
    fontSize: 13.5,
    fontWeight: "700",
  },
});
