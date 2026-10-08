import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Trophy, BarChart3, TrendingUp, Package, Percent, ShoppingBag, Layers, Building2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BranchSubCategorySalesItem, BranchSubCategorySalesTotals } from '../../api/branchSubCategorySalesApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export type SubCategoryChartMetric = 'SALES' | 'QTY' | 'DISCOUNT';
export type SubCategoryChartGroup = 'SUB_CATEGORY' | 'CATEGORY' | 'DEPARTMENT' | 'STORE';

interface BranchSubCategorySalesVisualChartProps {
  records: BranchSubCategorySalesItem[];
  totals: BranchSubCategorySalesTotals;
}

export const BranchSubCategorySalesVisualChart: React.FC<BranchSubCategorySalesVisualChartProps> = ({
  records,
  totals,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const [selectedMetric, setSelectedMetric] = useState<SubCategoryChartMetric>('SALES');
  const [groupBy, setGroupBy] = useState<SubCategoryChartGroup>('SUB_CATEGORY');

  // Aggregated data according to grouping mode
  const chartItems = useMemo(() => {
    const map: Record<string, { label: string; subLabel: string; sales_amount: number; total_qty: number; discount: number }> = {};

    records.forEach((r) => {
      let key = r.sub_category || 'GENERAL';
      let subText = `${r.category} • ${r.department}`;

      if (groupBy === 'CATEGORY') {
        key = r.category || 'GENERAL';
        subText = `Dept: ${r.department}`;
      } else if (groupBy === 'DEPARTMENT') {
        key = r.department || 'GENERAL';
        subText = `Department Sales`;
      } else if (groupBy === 'STORE') {
        key = r.branch_name || `Store ${r.branch_code}`;
        subText = `Code: ${r.branch_code}`;
      }

      if (!map[key]) {
        map[key] = {
          label: key,
          subLabel: subText,
          sales_amount: 0,
          total_qty: 0,
          discount: 0,
        };
      }
      map[key].sales_amount += r.sales_amount;
      map[key].total_qty += r.total_qty;
      map[key].discount += r.discount;
    });

    const list = Object.values(map);

    if (selectedMetric === 'QTY') {
      return list.sort((a, b) => b.total_qty - a.total_qty);
    }
    if (selectedMetric === 'DISCOUNT') {
      return list.sort((a, b) => b.discount - a.discount);
    }
    return list.sort((a, b) => b.sales_amount - a.sales_amount);
  }, [records, groupBy, selectedMetric]);

  const getMetricVal = (item: any) => {
    if (selectedMetric === 'QTY') return item.total_qty;
    if (selectedMetric === 'DISCOUNT') return item.discount;
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
    if (selectedMetric === 'DISCOUNT') return totals.total_discount || 1;
    return totals.total_sales_amount || 1;
  }, [totals, selectedMetric]);

  const formatMetricVal = (val: number) => {
    if (selectedMetric === 'QTY') return `${formatNumber(val)} units`;
    return formatCurrency(val);
  };

  return (
    <View style={styles.chartContainer}>
      {/* Grouping & Metric Selectors */}
      <View style={styles.selectorSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Grouping Level
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
            <TouchableOpacity
              style={[
                styles.groupChip,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                groupBy === 'SUB_CATEGORY' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setGroupBy('SUB_CATEGORY')}
            >
              <Text style={[styles.groupChipText, { color: groupBy === 'SUB_CATEGORY' ? '#ffffff' : theme.textSecondary }]}>
                Sub-Category
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.groupChip,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                groupBy === 'CATEGORY' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setGroupBy('CATEGORY')}
            >
              <Text style={[styles.groupChipText, { color: groupBy === 'CATEGORY' ? '#ffffff' : theme.textSecondary }]}>
                Category
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.groupChip,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                groupBy === 'DEPARTMENT' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setGroupBy('DEPARTMENT')}
            >
              <Text style={[styles.groupChipText, { color: groupBy === 'DEPARTMENT' ? '#ffffff' : theme.textSecondary }]}>
                Department
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
                Store
              </Text>
            </TouchableOpacity>
          </ScrollView>
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

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'DISCOUNT' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('DISCOUNT')}
          >
            <Percent size={12} color={selectedMetric === 'DISCOUNT' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'DISCOUNT' ? '#ffffff' : theme.textSecondary }]}>
              Discount
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
                {groupBy} Performance
              </Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
              Ranking across top {Math.min(chartItems.length, 30)} groups ({formatNumber(records.length)} total entries)
            </Text>
          </View>

          {chartItems.length > 0 && (
            <View style={[styles.topRankBadge, { backgroundColor: isDark ? '#3f2c00' : '#fef9c3', borderColor: '#fef08a' }]}>
              <Trophy size={12} color="#ca8a04" style={{ marginRight: 4 }} />
              <Text style={[styles.topRankBadgeText, { color: '#a16207' }]}>
                #1 {chartItems[0].label}
              </Text>
            </View>
          )}
        </View>

        {/* Visual Bar Chart Rows (Top 30) */}
        <View style={styles.chartRowsContainer}>
          {chartItems.slice(0, 30).map((item, idx) => {
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
