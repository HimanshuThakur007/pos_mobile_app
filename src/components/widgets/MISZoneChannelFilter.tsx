import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface MISZoneChannelFilterProps {
  viewMode: 'OPERATIONAL' | 'MIS_FINANCIALS';
  onToggleViewMode: (mode: 'OPERATIONAL' | 'MIS_FINANCIALS') => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  selectedChannel: string;
  onSelectChannel: (channel: string) => void;
}

export const MISZoneChannelFilter: React.FC<MISZoneChannelFilterProps> = ({
  viewMode,
  onToggleViewMode,
  selectedZone,
  onSelectZone,
  selectedChannel,
  onSelectChannel,
}) => {
  const { theme, isDark } = useTheme();

  const zones = [
    { label: 'All Zones', value: 'ALL' },
    { label: 'North', value: 'North Zone' },
    { label: 'West', value: 'West Zone' },
    { label: 'South', value: 'South Zone' },
    { label: 'East', value: 'East Zone' },
  ];

  return (
    <View style={styles.container}>
      {/* Segmented Slider Control */}
      <View style={[styles.segmentContainer, { backgroundColor: isDark ? '#3a3b3c' : '#e2e8f0' }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'MIS_FINANCIALS' && { backgroundColor: theme.primary }]}
          onPress={() => onToggleViewMode('MIS_FINANCIALS')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: viewMode === 'MIS_FINANCIALS' ? '#ffffff' : theme.textSecondary }]}>
            💼 C-Suite MIS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'OPERATIONAL' && { backgroundColor: theme.primary }]}
          onPress={() => onToggleViewMode('OPERATIONAL')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: viewMode === 'OPERATIONAL' ? '#ffffff' : theme.textSecondary }]}>
            ⚡ Live POS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Zone Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        {zones.map((z) => {
          const isSelected = selectedZone === z.value;
          return (
            <TouchableOpacity
              key={z.value}
              style={[
                styles.chip,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
                isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => onSelectZone(z.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: isSelected ? '#ffffff' : theme.textPrimary }]}>
                {z.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeSegmentBtn: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  activeSegmentText: {
    color: '#ffffff',
  },
  chipScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  activeChip: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  activeChipText: {
    color: '#ffffff',
  },
});
