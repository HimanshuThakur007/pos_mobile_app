import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

export interface HourlyBreakdownItem {
  hourRange: string;
  netSales: number;
  ordersCount: number;
  aov: number;
}

interface SalesReportHourlyTabProps {
  hourlyBreakdown: HourlyBreakdownItem[];
  fromDate: string;
  toDate: string;
}

export const SalesReportHourlyTab: React.FC<SalesReportHourlyTabProps> = ({
  hourlyBreakdown,
  fromDate,
  toDate,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.mainCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Intraday Sales Velocity (Hourly)</Text>

      {hourlyBreakdown.length === 0 ? (
        <View style={styles.emptyBox}>
          <Clock size={40} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Hourly Velocity Data</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>No billing data found for selected period ({fromDate} to {toDate}).</Text>
        </View>
      ) : (
        hourlyBreakdown.map((row) => (
          <View key={row.hourRange} style={[styles.hourlyItemCard, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
            <View style={styles.hourlyItemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hourlyItemTitle, { color: theme.textPrimary }]}>{row.hourRange}</Text>
                <Text style={[styles.hourlyItemSub, { color: theme.textSecondary }]}>
                  {row.ordersCount} Receipts • AOV: {formatCurrency(row.aov)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.hourlyItemNet, { color: theme.primary }]}>{formatCurrency(row.netSales)}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  hourlyItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  hourlyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hourlyItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  hourlyItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  hourlyItemNet: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563eb',
  },
});
