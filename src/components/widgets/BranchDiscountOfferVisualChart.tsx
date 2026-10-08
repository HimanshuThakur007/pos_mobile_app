import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Trophy, BarChart3, Percent, Tag, Package, Ticket, Gift } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BranchDiscountOfferItem, BranchDiscountOfferTotals } from '../../api/branchDiscountOfferApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export type DiscountChartMetric = 'TOTAL_DISCOUNT' | 'DISCOUNT_PCT' | 'OFFER_QTY' | 'LINE_DISCOUNT';

interface BranchDiscountOfferVisualChartProps {
  records: BranchDiscountOfferItem[];
  totals: BranchDiscountOfferTotals;
}

export const BranchDiscountOfferVisualChart: React.FC<BranchDiscountOfferVisualChartProps> = ({
  records,
  totals,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 520;

  const [selectedMetric, setSelectedMetric] = useState<DiscountChartMetric>('TOTAL_DISCOUNT');

  const chartItems = useMemo(() => {
    const list = [...records];
    if (selectedMetric === 'DISCOUNT_PCT') {
      return list.sort((a, b) => b.discount_pct_of_sales - a.discount_pct_of_sales);
    }
    if (selectedMetric === 'OFFER_QTY') {
      return list.sort((a, b) => b.offer_qty - a.offer_qty);
    }
    if (selectedMetric === 'LINE_DISCOUNT') {
      return list.sort((a, b) => b.line_discount - a.line_discount);
    }
    return list.sort((a, b) => b.total_discount - a.total_discount);
  }, [records, selectedMetric]);

  const getMetricVal = (item: BranchDiscountOfferItem) => {
    if (selectedMetric === 'DISCOUNT_PCT') return item.discount_pct_of_sales;
    if (selectedMetric === 'OFFER_QTY') return item.offer_qty;
    if (selectedMetric === 'LINE_DISCOUNT') return item.line_discount;
    return item.total_discount;
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

  const formatMetricVal = (val: number) => {
    if (selectedMetric === 'DISCOUNT_PCT') return `${val.toFixed(1)}%`;
    if (selectedMetric === 'OFFER_QTY') return `${formatNumber(val)} Pcs`;
    return formatCurrency(val);
  };

  return (
    <View style={styles.chartContainer}>
      {/* Metric Selector Controls */}
      <View style={styles.selectorSection}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Rank By Metric</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'TOTAL_DISCOUNT' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('TOTAL_DISCOUNT')}
          >
            <Percent size={12} color={selectedMetric === 'TOTAL_DISCOUNT' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'TOTAL_DISCOUNT' ? '#ffffff' : theme.textSecondary }]}>
              Total Discount
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'DISCOUNT_PCT' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('DISCOUNT_PCT')}
          >
            <Tag size={12} color={selectedMetric === 'DISCOUNT_PCT' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'DISCOUNT_PCT' ? '#ffffff' : theme.textSecondary }]}>
              Discount %
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'OFFER_QTY' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('OFFER_QTY')}
          >
            <Package size={12} color={selectedMetric === 'OFFER_QTY' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'OFFER_QTY' ? '#ffffff' : theme.textSecondary }]}>
              Offer Qty
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
                Store Discount Performance
              </Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
              Store comparison across {chartItems.length} stores
            </Text>
          </View>

          {chartItems.length > 0 && (
            <View style={[styles.topRankBadge, { backgroundColor: isDark ? '#3f2c00' : '#fef9c3', borderColor: '#fef08a' }]}>
              <Trophy size={12} color="#ca8a04" style={{ marginRight: 4 }} />
              <Text style={[styles.topRankBadgeText, { color: '#a16207' }]} numberOfLines={1}>
                #1 {chartItems[0].branch_name}
              </Text>
            </View>
          )}
        </View>

        {/* Visual Bar Chart Rows */}
        <View style={styles.chartRowsContainer}>
          {chartItems.map((item, idx) => {
            const val = getMetricVal(item);
            const barPct = maxValue > 0 ? Math.min(100, Math.max(4, (val / maxValue) * 100)) : 0;

            let barColor = theme.primary;
            if (idx === 0) barColor = '#eab308';
            else if (idx === 1) barColor = '#3b82f6';
            else if (idx === 2) barColor = '#10b981';

            return (
              <View key={item.branch_code + '-' + idx} style={styles.chartRow}>
                <View style={styles.storeHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {idx + 1}. {item.branch_name}
                    </Text>
                    <Text style={[styles.sharePctText, { color: theme.textMuted }]} numberOfLines={1}>
                      Code: {item.branch_code} • {item.discount_pct_of_sales.toFixed(1)}% of Sales ({formatCurrency(item.sales_amount)})
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricValText, { color: idx === 0 ? '#ca8a04' : theme.textPrimary }]}>
                      {formatMetricVal(val)}
                    </Text>
                    <Text style={[styles.sharePctText, { color: theme.textMuted }]}>
                      {formatNumber(item.offer_qty)} offer pcs
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
