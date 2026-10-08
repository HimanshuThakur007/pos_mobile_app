import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Trophy, BarChart3, TrendingUp, CreditCard, ShoppingBag, Calendar, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BranchDailySalesItem, BranchDailySalesTotals } from '../../api/branchDailySalesApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export type DailyChartMetric = 'NET_SALES' | 'GROSS_SALES' | 'BILLS' | 'RETURNS';

interface BranchDailySalesVisualChartProps {
  records: BranchDailySalesItem[];
  totals: BranchDailySalesTotals;
}

export const BranchDailySalesVisualChart: React.FC<BranchDailySalesVisualChartProps> = ({
  records,
  totals,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const [selectedMetric, setSelectedMetric] = useState<DailyChartMetric>('NET_SALES');
  const [groupBy, setGroupBy] = useState<'STORE' | 'DATE'>('STORE');

  // Aggregated data by Store or by Date for visual charts
  const chartItems = useMemo(() => {
    if (groupBy === 'STORE') {
      const storeMap: Record<string, { label: string; subLabel: string; net_sales: number; sales_amount: number; return_amount: number; bill_count: number }> = {};

      records.forEach((r) => {
        const key = r.branch_code;
        if (!storeMap[key]) {
          storeMap[key] = {
            label: r.branch_name || `Store #${r.branch_code}`,
            subLabel: `Code: ${r.branch_code}`,
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
    } else {
      const dateMap: Record<string, { label: string; subLabel: string; net_sales: number; sales_amount: number; return_amount: number; bill_count: number }> = {};

      records.forEach((r) => {
        const key = r.date || 'Unknown Date';
        if (!dateMap[key]) {
          dateMap[key] = {
            label: key,
            subLabel: 'Daily Total Across Selected Stores',
            net_sales: 0,
            sales_amount: 0,
            return_amount: 0,
            bill_count: 0,
          };
        }
        dateMap[key].net_sales += r.net_sales;
        dateMap[key].sales_amount += r.sales_amount;
        dateMap[key].return_amount += r.return_amount;
        dateMap[key].bill_count += r.bill_count;
      });

      return Object.values(dateMap).sort((a, b) => b.label.localeCompare(a.label));
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
    if (selectedMetric === 'RETURNS') return 'Returns Amount';
    if (selectedMetric === 'BILLS') return 'Bill Count';
    return 'Net Sales';
  };

  return (
    <View style={styles.chartContainer}>
      {/* Grouping & Metric Selectors */}
      <View style={styles.selectorSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Daily Sales Visualization
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
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

            <TouchableOpacity
              style={[
                styles.groupChip,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                groupBy === 'DATE' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setGroupBy('DATE')}
            >
              <Text style={[styles.groupChipText, { color: groupBy === 'DATE' ? '#ffffff' : theme.textSecondary }]}>
                By Date
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
              selectedMetric === 'RETURNS' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('RETURNS')}
          >
            <AlertTriangle size={12} color={selectedMetric === 'RETURNS' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'RETURNS' ? '#ffffff' : theme.textSecondary }]}>
              Returns
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
        </ScrollView>
      </View>

      {/* Visual Chart Card */}
      <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={[styles.chartHeader, isMobile && { flexDirection: 'column', gap: 6 }, { borderBottomColor: theme.divider }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BarChart3 size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                Daily Trend: {getMetricLabel()}
              </Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
              {groupBy === 'STORE' ? `Performance per Store` : `Daily Breakdown Trend`} ({chartItems.length} entries)
            </Text>
          </View>

          {chartItems.length > 0 && (
            <View style={[styles.topRankBadge, { backgroundColor: isDark ? '#3f2c00' : '#fef9c3', borderColor: '#fef08a' }]}>
              <Trophy size={12} color="#ca8a04" style={{ marginRight: 4 }} />
              <Text style={[styles.topRankBadgeText, { color: '#a16207' }]}>
                Top: {chartItems[0].label}
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

            let barColor = theme.primary;
            if (selectedMetric === 'RETURNS') barColor = '#ef4444';
            else if (idx === 0) barColor = '#eab308';
            else if (idx === 1) barColor = '#3b82f6';
            else if (idx === 2) barColor = '#10b981';

            return (
              <View key={item.label + '-' + idx} style={styles.chartRow}>
                <View style={styles.storeHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={[styles.sharePctText, { color: theme.textMuted }]}>
                      {item.subLabel}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricValText, { color: selectedMetric === 'RETURNS' ? '#ef4444' : theme.textPrimary }]}>
                      {formatMetricVal(val)}
                    </Text>
                    <Text style={[styles.sharePctText, { color: theme.textMuted }]}>
                      {sharePct.toFixed(1)}% share
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
