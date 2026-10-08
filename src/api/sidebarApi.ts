import sidebarMenuData from "../data/sidebarMenu.json";
import { SHOW_ERP_POS_AND_BILLS } from "../config/navigationConfig";

export interface SidebarMenuItem {
  name: string;
  label: string;
  subtitle: string;
  icon: string;
  badge?: string;
  requiresFlag?: string;
}

export interface SidebarMenuGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  requiresFlag?: string;
  items: SidebarMenuItem[];
}

export interface SidebarMenuData {
  menuGroups: SidebarMenuGroup[];
  standaloneItems: SidebarMenuItem[];
}

/**
 * Feature flag checker.
 * Can be extended for user roles/permissions returned by API in the future.
 */
const isFlagEnabled = (flagName?: string): boolean => {
  if (!flagName) return true;
  if (flagName === "SHOW_ERP_POS_AND_BILLS") {
    return SHOW_ERP_POS_AND_BILLS === 1;
  }
  return true;
};

/**
 * Fetches sidebar menu configuration.
 * Currently reads from static JSON file (src/data/sidebarMenu.json).
 * In the future, this function can be modified to call an API endpoint:
 *   const response = await apiClient.get('/navigation/sidebar');
 *   return response.data;
 */
export const fetchSidebarMenu = async (): Promise<SidebarMenuData> => {
  // Simulate network delay if needed, or return JSON directly
  const data = sidebarMenuData as SidebarMenuData;

  const filteredGroups = data.menuGroups
    .filter((group) => isFlagEnabled(group.requiresFlag))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isFlagEnabled(item.requiresFlag)),
    }));

  const filteredStandalone = data.standaloneItems.filter((item) =>
    isFlagEnabled(item.requiresFlag)
  );

  return {
    menuGroups: filteredGroups,
    standaloneItems: filteredStandalone,
  };
};
