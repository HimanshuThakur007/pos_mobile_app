import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Trophy, BarChart3, TrendingUp, CreditCard, ShoppingBag, Clock, AlertTriangle, Zap } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BranchHourlySalesItem, BranchHourlySalesTotals } from '../../api/branchHourlySalesApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export type HourlyChartMetric = 'NET_SALES' | 'GROSS_SALES' | 'BILLS' | 'RETURNS';

interface BranchHourlySalesVisualChartProps {
  records: BranchHourlySalesItem[];
  totals: BranchHourlySalesTotals;
}

export const BranchHourlySalesVisualChart: React.FC<BranchHourlySalesVisualChartProps> = ({
  records,
  totals,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const [selectedMetric, setSelectedMetric] = useState<HourlyChartMetric>('NET_SALES');
  const [groupBy, setGroupBy] = useState<'HOUR' | 'STORE'>('HOUR');

  // Group items by Hour Slot or by Store
  const chartItems = useMemo(() => {
    if (groupBy === 'HOUR') {
      const hourMap: Record<string, { label: string; hour: number; net_sales: number; sales_amount: number; return_amount: number; bill_count: number }> = {};

      records.forEach((r) => {
        const key = r.hour_label || `${r.hour}:00`;
        if (!hourMap[key]) {
          hourMap[key] = {
            label: key,
            hour: r.hour,
            net_sales: 0,
            sales_amount: 0,
            return_amount: 0,
            bill_count: 0,
          };
        }
        hourMap[key].net_sales += r.net_sales;
        hourMap[key].sales_amount += r.sales_amount;
        hourMap[key].return_amount += r.return_amount;
        hourMap[key].bill_count += r.bill_count;
      });

      return Object.values(hourMap).sort((a, b) => a.hour - b.hour);
    } else {
      const storeMap: Record<string, { label: string; hour: number; net_sales: number; sales_amount: number; return_amount: number; bill_count: number }> = {};

      records.forEach((r) => {
        const key = r.branch_code;
        if (!storeMap[key]) {
          storeMap[key] = {
            label: r.branch_name || `Store #${r.branch_code}`,
            hour: 0,
            net_sales: 0,
            sales_amount: 0,
            return_amount: 0,
            bill_count: 0,
          };
        }
        storeMap[key].net_sales += r.net_sales;
        storeMap[key].sales_amount += r.sales_amount;
        storeMap[key].return_amount += r.return_amount;
        storeMap[key].bill_count += r.bill_count;
      });

      return Object.values(storeMap).sort((a, b) => b.net_sales - a.net_sales);
    }
  }, [records, groupBy]);

  const getMetricVal = (item: any) => {
    if (selectedMetric === 'GROSS_SALES') return item.sales_amount;
    if (selectedMetric === 'RETURNS') return item.return_amount;
    if (selectedMetric === 'BILLS') return item.bill_count;
    return item.net_sales;
  };

  const maxValue = useMemo(() => {
    if (chartItems.length === 0) return 1;
    let max = 0;
    chartItems.forEach((item) => {
      const v = getMetricVal(item);
      if (v > max) max = v;
    });
    return Math.max(max, 1);
  }, [chartItems, selectedMetric]);

  const metricTotal = useMemo(() => {
    if (selectedMetric === 'GROSS_SALES') return totals.total_sales_amount || 1;
    if (selectedMetric === 'RETURNS') return totals.total_return_amount || 1;
    if (selectedMetric === 'BILLS') return totals.total_bill_count || 1;
    return totals.total_net_sales || 1;
  }, [totals, selectedMetric]);

  const formatMetricVal = (val: number) => {
    if (selectedMetric === 'BILLS') return `${formatNumber(val)} bills`;
    return formatCurrency(val);
  };

  const getMetricLabel = () => {
    if (selectedMetric === 'GROSS_SALES') return 'Gross Sales';
    if (selectedMetric === 'RETURNS') return 'Returns';
    if (selectedMetric === 'BILLS') return 'Bill Count';
    return 'Net Sales';
  };

  return (
    <View style={styles.chartContainer}>
      {/* Grouping & Metric Selectors */}
      <View style={styles.selectorSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Hourly Sales Visualization
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[
                styles.groupChip,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                groupBy === 'HOUR' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setGroupBy('HOUR')}
            >
              <Text style={[styles.groupChipText, { color: groupBy === 'HOUR' ? '#ffffff' : theme.textSecondary }]}>
                By Hour Slot
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.groupChip,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                groupBy === 'STORE' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setGroupBy('STORE')}
            >
              <Text style={[styles.groupChipText, { color: groupBy === 'STORE' ? '#ffffff' : theme.textSecondary }]}>
                By Store
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'NET_SALES' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('NET_SALES')}
          >
            <TrendingUp size={12} color={selectedMetric === 'NET_SALES' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'NET_SALES' ? '#ffffff' : theme.textSecondary }]}>
              Net Sales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'GROSS_SALES' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('GROSS_SALES')}
          >
            <ShoppingBag size={12} color={selectedMetric === 'GROSS_SALES' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'GROSS_SALES' ? '#ffffff' : theme.textSecondary }]}>
              Gross Sales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'BILLS' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('BILLS')}
          >
            <CreditCard size={12} color={selectedMetric === 'BILLS' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'BILLS' ? '#ffffff' : theme.textSecondary }]}>
              Bill Count
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'RETURNS' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('RETURNS')}
          >
            <AlertTriangle size={12} color={selectedMetric === 'RETURNS' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'RETURNS' ? '#ffffff' : theme.textSecondary }]}>
              Returns
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Visual Bar Chart Card */}
      <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={[styles.chartHeader, isMobile && { flexDirection: 'column', gap: 6 }, { borderBottomColor: theme.divider }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                Hourly Velocity: {getMetricLabel()}
              </Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
              {groupBy === 'HOUR' ? `Sales distribution by hourly window` : `Store Hourly Aggregates`}
            </Text>
          </View>

          {totals?.peak_hour_label && totals.peak_hour_label !== 'None' && (
            <View style={[styles.topRankBadge, { backgroundColor: isDark ? '#1e3a8a33' : '#dbeafe', borderColor: '#bfdbfe' }]}>
              <Zap size={12} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.topRankBadgeText, { color: theme.primary }]}>
                Peak: {totals.peak_hour_label}
              </Text>
            </View>
          )}
        </View>

        {/* Visual Bar Chart Rows */}
        <View style={styles.chartRowsContainer}>
          {chartItems.map((item, idx) => {
            const val = getMetricVal(item);
            const barPct = maxValue > 0 ? Math.min(100, Math.max(4, (val / maxValue) * 100)) : 0;
            const sharePct = metricTotal > 0 ? (val / metricTotal) * 100 : 0;
            const isPeak = item.label === totals?.peak_hour_label;

            let barColor = theme.primary;
            if (selectedMetric === 'RETURNS') barColor = '#ef4444';
            else if (isPeak) barColor = '#3b82f6';

            return (
              <View key={item.label + '-' + idx} style={styles.chartRow}>
                <View style={styles.storeHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {isPeak && (
                      <View style={[styles.peakTag, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
                        <Text style={[styles.peakTagText, { color: theme.primary }]}>PEAK</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricValText, { color: selectedMetric === 'RETURNS' ? '#ef4444' : theme.textPrimary }]}>
                      {formatMetricVal(val)}
                    </Text>
                    <Text style={[styles.sharePctText, { color: theme.textMuted }]}>
                      {sharePct.toFixed(1)}% of total
                    </Text>
                  </View>
                </View>

                {/* Progress Bar Track */}
                <View style={[styles.barTrack, { backgroundColor: theme.subtleBoxBg }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${barPct}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    gap: 12,
  },
  selectorSection: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  groupChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  chartSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  topRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  topRankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chartRowsContainer: {
    gap: 12,
  },
  chartRow: {
    gap: 4,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  peakTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  peakTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  metricValText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sharePctText: {
    fontSize: 10,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
