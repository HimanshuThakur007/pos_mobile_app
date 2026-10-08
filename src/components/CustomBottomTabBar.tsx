import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { drawerEvents } from "../utils/drawerEvents";
import { useTheme } from "../context/ThemeContext";
import { Home, FileText, GitCompare, Menu } from "lucide-react-native";
import { SHOW_ERP_POS_AND_BILLS } from "../config/navigationConfig";

export interface CustomBottomTabBarProps extends Partial<BottomTabBarProps> {
  activeRouteName?: string;
  onSelectTab?: (routeName: string) => void;
  onOpenDrawer?: () => void;
  onRouteNameChange?: (routeName: string) => void;
}

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  activeRouteName,
  onSelectTab,
  onOpenDrawer,
  onRouteNameChange,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const currentRouteName = state ? state.routes[state.index]?.name : undefined;

  React.useEffect(() => {
    if (currentRouteName && onRouteNameChange) {
      onRouteNameChange(currentRouteName);
    }
  }, [currentRouteName, onRouteNameChange]);

  const tabs = [
    { routeName: "POSSales", label: "Home", icon: Home, isMenu: false },
    ...(SHOW_ERP_POS_AND_BILLS === 1
      ? [
          {
            routeName: "BillComparison",
            label: "Store Bills",
            icon: FileText,
            isMenu: false,
          },
          {
            routeName: "ErpPosComparison",
            label: "ERP vs POS",
            icon: GitCompare,
            isMenu: false,
          },
        ]
      : []),
    { routeName: "Menu", label: "Menu", icon: Menu, isMenu: true },
  ];

  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 12 : 0);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          paddingBottom: bottomInset,
          backgroundColor: theme.navBg,
          borderTopColor: theme.border,
        },
      ]}
    >
      <View style={[styles.tabBarCard, { backgroundColor: theme.navBg }]}>
        {tabs.map((tab) => {
          const routeIndex =
            state?.routes.findIndex((r) => r.name === tab.routeName) ?? -1;
          const isFocused = tab.isMenu
            ? false
            : activeRouteName
              ? activeRouteName === tab.routeName
              : state
                ? state.index === routeIndex && routeIndex !== -1
                : false;
          const IconComponent = tab.icon;

          const onPress = () => {
            if (tab.isMenu) {
              drawerEvents.openDrawer();
              if (onOpenDrawer) {
                onOpenDrawer();
              }
              if (onSelectTab) {
                onSelectTab("Menu");
              }
              return;
            }

            if (onSelectTab) {
              onSelectTab(tab.routeName);
            } else if (navigation) {
              navigation.navigate(tab.routeName);
            }
          };

          const activeColor = theme.primary;
          const inactiveColor = theme.textSecondary;

          return (
            <TouchableOpacity
              key={tab.routeName}
              style={[
                styles.tabItem,
              ]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isFocused && { backgroundColor: theme.primaryLight }]}>
                <IconComponent
                  size={20}
                  color={isFocused ? activeColor : inactiveColor}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? activeColor : inactiveColor },
                  isFocused && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    zIndex: 1000,
    elevation: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  tabBarCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    height: 54,
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 2,
  },
  activeTabLabel: {
    fontWeight: "800",
  },
});
