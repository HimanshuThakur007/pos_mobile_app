import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { useTheme } from '../context/ThemeContext';

export const AnalyticsScreen: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const { theme, isDark } = useTheme();

  const storePerformance = [
    { name: 'Downtown flagship', sales: '$48,200', target: '105%', growth: '+18%' },
    { name: 'Northside Mall Outlet', sales: '$36,150', target: '98%', growth: '+12%' },
    { name: 'Westend Express Kiosk', sales: '$24,900', target: '112%', growth: '+24%' },
    { name: 'Airport Concourse B', sales: '$18,400', target: '92%', growth: '+5%' },
  ];

  const hourlyBreakdown = [
    { hour: '08:00 AM', volume: '$2,400', barWidth: '35%' },
    { hour: '11:00 AM', volume: '$6,800', barWidth: '85%' },
    { hour: '02:00 PM', volume: '$8,100', barWidth: '100%' },
    { hour: '05:00 PM', volume: '$7,200', barWidth: '90%' },
    { hour: '08:00 PM', volume: '$3,900', barWidth: '50%' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header title="Analytics" subtitle="Sales Performance & Store Metrics" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Timeframe Selector */}
        <View style={[styles.timeframeContainer, { backgroundColor: theme.subtleBoxBg }]}>
          {(['today', 'week', 'month'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.timeframeTab,
                timeframe === t && { backgroundColor: theme.cardBg },
              ]}
              onPress={() => setTimeframe(t)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  { color: timeframe === t ? theme.primary : theme.textSecondary },
                ]}
              >
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.grid}>
          <StatCard
            title="Avg Order Value"
            value="$42.80"
            change="5.4%"
            isPositive={true}
          />
          <StatCard
            title="Conversion Rate"
            value="18.6%"
            change="2.1%"
            isPositive={true}
          />
        </View>

        {/* Store Performance */}
        <Card>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Top Performing Stores</Text>
          {storePerformance.map((store, index) => (
            <View key={index} style={[styles.storeRow, { borderBottomColor: theme.border }]}>
              <View style={styles.storeMain}>
                <Text style={[styles.storeName, { color: theme.textPrimary }]}>{store.name}</Text>
                <Text style={[styles.storeSales, { color: theme.textSecondary }]}>Volume: {store.sales}</Text>
              </View>
              <View style={styles.storeBadges}>
                <Badge label={`Target: ${store.target}`} variant="info" />
                <View style={{ width: 4 }} />
                <Badge label={store.growth} variant="success" />
              </View>
            </View>
          ))}
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Hourly Peak Sales Matrix</Text>
          {hourlyBreakdown.map((item, idx) => (
            <View key={idx} style={styles.hourlyRow}>
              <Text style={[styles.hourLabel, { color: theme.textSecondary }]}>{item.hour}</Text>
              <View style={[styles.barTrack, { backgroundColor: theme.subtleBoxBg }]}>
                <View style={[styles.barFill, { width: item.barWidth as any }]} />
              </View>
              <Text style={[styles.hourVolume, { color: theme.textPrimary }]}>{item.volume}</Text>
            </View>
          ))}
        </Card>
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
  },
  timeframeContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  timeframeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  storeMain: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  storeSales: {
    fontSize: 12,
    marginTop: 2,
  },
  storeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hourLabel: {
    width: 75,
    fontSize: 12,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  hourVolume: {
    width: 65,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
});
