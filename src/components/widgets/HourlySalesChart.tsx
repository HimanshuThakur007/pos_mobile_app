import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../Card';
import { useTheme } from '../../context/ThemeContext';
import { HourlySalesPoint } from '../../types/posSales';

interface HourlySalesChartProps {
  hourlyData: HourlySalesPoint[];
}

export const HourlySalesChart: React.FC<HourlySalesChartProps> = ({ hourlyData }) => {
  const { theme, isDark } = useTheme();
  const maxActual = Math.max(...hourlyData.map((d) => d.actual), 1);

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Hourly Sales Velocity</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Intraday hourly revenue distribution</Text>
        </View>
        <View style={[styles.peakBadge, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
          <Text style={[styles.peakBadgeText, { color: isDark ? '#6ee7b7' : '#15803d' }]}>⚡ Peak 2:00 PM</Text>
        </View>
      </View>

      {hourlyData.slice(0, 7).map((point, index) => {
        const barWidth = `${Math.min((point.actual / maxActual) * 100, 100)}%`;
        const isPeak = point.actual === maxActual;

        return (
          <View key={index} style={styles.row}>
            <Text style={[styles.hourText, { color: theme.textSecondary }]}>{point.hour}</Text>
            <View style={[styles.barTrack, { backgroundColor: isDark ? '#3a3b3c' : '#f1f5f9' }]}>
              <View
                style={[
                  styles.barFill,
                  { width: barWidth as any, backgroundColor: theme.primary },
                  isPeak && styles.peakBarFill,
                ]}
              />
            </View>
            <Text style={[styles.amountText, { color: theme.textPrimary }, isPeak && { color: isDark ? '#6ee7b7' : '#16a34a' }]}>
              ₹{(point.actual / 1000).toFixed(0)}k
            </Text>
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  peakBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  peakBadgeText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hourText: {
    width: 65,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 5,
  },
  peakBarFill: {
    backgroundColor: '#10b981',
  },
  amountText: {
    width: 50,
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },
  peakAmountText: {
    color: '#16a34a',
  },
});
