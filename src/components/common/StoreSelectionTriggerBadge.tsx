import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building2, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SimpleBranch, getStoreFilterLabel } from '../../utils/formatters';

export interface StoreSelectionTriggerBadgeProps {
  selectedBranchCodes: string[];
  branches: SimpleBranch[];
  onPress: () => void;
  label?: string;
}

export const StoreSelectionTriggerBadge: React.FC<StoreSelectionTriggerBadgeProps> = ({
  selectedBranchCodes,
  branches,
  onPress,
  label = 'Selected Store',
}) => {
  const { theme, isDark } = useTheme();
  const storeLabel = getStoreFilterLabel(selectedBranchCodes, branches);
  const count = selectedBranchCodes.length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</Text>
        <View style={[styles.countBadge, { backgroundColor: count > 0 ? theme.primaryLight : theme.subtleBoxBg }]}>
          <Text style={[styles.countBadgeText, { color: count > 0 ? theme.primary : theme.textMuted }]}>
            {count === 0 ? 'All Stores' : count === 1 ? '1 Store Selected' : `${count} Stores Selected`}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.badgeCard,
          {
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            borderColor: count > 0 ? theme.primary : theme.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.leftGroup}>
          <View style={[styles.iconRing, { backgroundColor: theme.primaryLight }]}>
            <Building2 size={16} color={theme.primary} />
          </View>
          <View style={styles.textGroup}>
            <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
              {storeLabel}
            </Text>
            <Text style={[styles.tapHintText, { color: theme.textMuted }]}>
              Tap to change store selection
            </Text>
          </View>
        </View>
        <ChevronDown size={16} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textGroup: {
    flex: 1,
  },
  storeNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tapHintText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});
