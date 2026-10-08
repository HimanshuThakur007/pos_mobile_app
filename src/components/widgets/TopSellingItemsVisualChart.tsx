import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Trophy, BarChart3, TrendingUp, Package, Building2, ShoppingBag } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { TopSellingItem, TopSellingItemsTotals } from '../../api/topSellingItemsApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export type TopItemChartMetric = 'SALES' | 'QTY';
export type TopItemChartGroup = 'ITEM' | 'STORE';

interface TopSellingItemsVisualChartProps {
  records: TopSellingItem[];
  totals: TopSellingItemsTotals;
}

export const TopSellingItemsVisualChart: React.FC<TopSellingItemsVisualChartProps> = ({
  records,
  totals,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 520;

  const [selectedMetric, setSelectedMetric] = useState<TopItemChartMetric>('SALES');
  const [groupBy, setGroupBy] = useState<TopItemChartGroup>('ITEM');

  const chartItems = useMemo(() => {
    if (groupBy === 'STORE') {
      const storeMap: Record<string, { label: string; subLabel: string; sales_amount: number; total_qty: number; itemCount: number }> = {};
      records.forEach((r) => {
        const key = r.branch_name || `Store ${r.branch_code}`;
        if (!storeMap[key]) {
          storeMap[key] = {
            label: key,
            subLabel: `Store Code: ${r.branch_code}`,
            sales_amount: 0,
            total_qty: 0,
            itemCount: 0,
          };
        }
        storeMap[key].sales_amount += r.sales_amount;
        storeMap[key].total_qty += r.total_qty;
        storeMap[key].itemCount += 1;
      });

      const list = Object.values(storeMap);
      if (selectedMetric === 'QTY') {
        return list.sort((a, b) => b.total_qty - a.total_qty);
      }
      return list.sort((a, b) => b.sales_amount - a.sales_amount);
    }

    // Default Grouping: BY_ITEM
    const itemMap: Record<string, { label: string; subLabel: string; sales_amount: number; total_qty: number; storeCount: number }> = {};
    records.forEach((r) => {
      const key = r.item_code || r.item_name;
      if (!itemMap[key]) {
        itemMap[key] = {
          label: r.item_name || r.item_code,
          subLabel: `Item Code: ${r.item_code}`,
          sales_amount: 0,
          total_qty: 0,
          storeCount: 0,
        };
      }
      itemMap[key].sales_amount += r.sales_amount;
      itemMap[key].total_qty += r.total_qty;
      itemMap[key].storeCount += 1;
    });

    const list = Object.values(itemMap);
    if (selectedMetric === 'QTY') {
      return list.sort((a, b) => b.total_qty - a.total_qty);
    }
    return list.sort((a, b) => b.sales_amount - a.sales_amount);
  }, [records, groupBy, selectedMetric]);

  const getMetricVal = (item: any) => {
    if (selectedMetric === 'QTY') return item.total_qty;
    return item.sales_amount;
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
    if (selectedMetric === 'QTY') return totals.total_qty || 1;
    return totals.total_sales_amount || 1;
  }, [totals, selectedMetric]);

  const formatMetricVal = (val: number) => {
    if (selectedMetric === 'QTY') return `${formatNumber(val)} Pcs`;
    return formatCurrency(val);
  };

  return (
    <View style={styles.chartContainer}>
      {/* Metric & Group Controls */}
      <View style={styles.selectorSection}>
        <View style={styles.controlRow}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Grouping</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[
                styles.groupChip,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                groupBy === 'ITEM' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setGroupBy('ITEM')}
            >
              <Text style={[styles.groupChipText, { color: groupBy === 'ITEM' ? '#ffffff' : theme.textSecondary }]}>
                By Item
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

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'SALES' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('SALES')}
          >
            <TrendingUp size={12} color={selectedMetric === 'SALES' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'SALES' ? '#ffffff' : theme.textSecondary }]}>
              Sales Amount
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'QTY' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('QTY')}
          >
            <Package size={12} color={selectedMetric === 'QTY' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'QTY' ? '#ffffff' : theme.textSecondary }]}>
              Units Sold
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visual Bar Chart Card */}
      <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={[styles.chartHeader, isMobile && { flexDirection: 'column', gap: 6 }, { borderBottomColor: theme.divider }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BarChart3 size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                Top 10 Selling Items {groupBy === 'STORE' ? 'by Store' : 'Performance'}
              </Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
              Rankings across {chartItems.length} top item groups ({formatNumber(records.length)} total store entries)
            </Text>
          </View>

          {chartItems.length > 0 && (
            <View style={[styles.topRankBadge, { backgroundColor: isDark ? '#3f2c00' : '#fef9c3', borderColor: '#fef08a' }]}>
              <Trophy size={12} color="#ca8a04" style={{ marginRight: 4 }} />
              <Text style={[styles.topRankBadgeText, { color: '#a16207' }]} numberOfLines={1}>
                #1 {chartItems[0].label}
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
            if (idx === 0) barColor = '#eab308';
            else if (idx === 1) barColor = '#3b82f6';
            else if (idx === 2) barColor = '#10b981';

            return (
              <View key={item.label + '-' + idx} style={styles.chartRow}>
                <View style={styles.storeHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {idx + 1}. {item.label}
                    </Text>
                    <Text style={[styles.sharePctText, { color: theme.textMuted }]} numberOfLines={1}>
                      {item.subLabel}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricValText, { color: idx === 0 ? '#ca8a04' : theme.textPrimary }]}>
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
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  groupChipText: {
    fontSize: 11,
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
