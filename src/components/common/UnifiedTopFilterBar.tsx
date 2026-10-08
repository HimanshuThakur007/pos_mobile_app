import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, RefreshCw, Download } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface ExtraPill {
  icon?: React.ComponentType<{ size: number; color: string; style?: any }>;
  label: string;
}

export interface UnifiedTopFilterBarProps {
  fromDate: string;
  toDate: string;
  extraPills?: ExtraPill[];
  onToggleFilters?: () => void;
  onRefreshData: () => void;
  onExportCSV?: () => void;
  showExport?: boolean;
}

export const UnifiedTopFilterBar: React.FC<UnifiedTopFilterBarProps> = ({
  fromDate,
  toDate,
  extraPills = [],
  onToggleFilters,
  onRefreshData,
  onExportCSV,
  showExport = false,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.compactTopBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1, marginRight: 8 }}
        contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          onPress={onToggleFilters}
          activeOpacity={onToggleFilters ? 0.7 : 1}
          disabled={!onToggleFilters}
        >
          <View style={[styles.contextPill, { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: theme.border }]}>
            <Calendar size={12} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.contextPillText, { color: theme.textPrimary }]} numberOfLines={1}>
              {fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`}
            </Text>
          </View>

          {extraPills.map((pill, idx) => {
            const IconComp = pill.icon;
            return (
              <View
                key={idx}
                style={[styles.contextPill, { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: theme.border }]}
              >
                {IconComp && <IconComp size={12} color={theme.primary} style={{ marginRight: 4 }} />}
                <Text style={[styles.contextPillText, { color: theme.textPrimary }]} numberOfLines={1}>
                  {pill.label}
                </Text>
              </View>
            );
          })}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.compactRightGroup}>
        <TouchableOpacity
          style={[styles.iconBtnLight, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}
          onPress={onRefreshData}
          activeOpacity={0.7}
        >
          <RefreshCw size={13} color={theme.primary} />
        </TouchableOpacity>

        {showExport && onExportCSV && (
          <TouchableOpacity style={styles.exportBtnLight} onPress={onExportCSV} activeOpacity={0.8}>
            <Download size={13} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.exportBtnLightText}>CSV</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMobile: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  pillsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  compactLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  compactRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  contextPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterModalTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterModalTriggerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  iconBtnLight: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  exportBtnLight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exportBtnLightText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
