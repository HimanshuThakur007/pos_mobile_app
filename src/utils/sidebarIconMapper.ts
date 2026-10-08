import React from "react";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  FileText,
  GitCompare,
  Trophy,
  FolderTree,
  Flame,
  Percent,
  Table,
  Calendar,
  Scale,
  Layers,
  BarChart3,
  Store,
  Folder,
  Sliders,
  Shield,
  User,
  HelpCircle,
  Target,
  Building2,
} from "lucide-react-native";

// Map of string icon names (from JSON / API) to Lucide icon components
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  CreditCard,
  Settings,
  FileText,
  GitCompare,
  Trophy,
  FolderTree,
  Flame,
  Percent,
  Table,
  Calendar,
  Scale,
  Layers,
  BarChart3,
  Store,
  Folder,
  Sliders,
  Shield,
  User,
  HelpCircle,
  Target,
  Building2,
};

/**
 * Resolves a string icon key to a Lucide icon component.
 * Fallback to Folder icon if the icon key is not found in ICON_MAP.
 */
export const getSidebarIcon = (iconName?: string): React.ElementType => {
  if (!iconName) return Folder;
  return ICON_MAP[iconName] || Folder;
};
