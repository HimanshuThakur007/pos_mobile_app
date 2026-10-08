import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Trophy, BarChart3, TrendingUp, CreditCard, ShoppingBag, Receipt, Percent, Award } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BranchWiseSalesItem, BranchWiseSalesTotals } from '../../api/branchSalesApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export type ChartMetric = 'NET_SALES' | 'BILLS' | 'QTY' | 'TAX' | 'DISCOUNT' | 'AOV';

interface BranchSalesVisualChartProps {
  records: BranchWiseSalesItem[];
  totals: BranchWiseSalesTotals;
}

export const BranchSalesVisualChart: React.FC<BranchSalesVisualChartProps> = ({
  records,
  totals,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('NET_SALES');

  // Sort records according to selected metric for clean visual ranking chart
  const sortedData = useMemo(() => {
    return [...records].sort((a, b) => {
      if (selectedMetric === 'BILLS') return b.bill_count - a.bill_count;
      if (selectedMetric === 'QTY') return b.total_qty - a.total_qty;
      if (selectedMetric === 'TAX') return b.tax - a.tax;
      if (selectedMetric === 'DISCOUNT') return b.discount - a.discount;
      if (selectedMetric === 'AOV') return b.avg_bill_value - a.avg_bill_value;
      return b.net_sales - a.net_sales;
    });
  }, [records, selectedMetric]);

  // Max value for computing percentage bar width
  const maxValue = useMemo(() => {
    if (sortedData.length === 0) return 1;
    const top = sortedData[0];
    if (selectedMetric === 'BILLS') return Math.max(top.bill_count, 1);
    if (selectedMetric === 'QTY') return Math.max(top.total_qty, 1);
    if (selectedMetric === 'TAX') return Math.max(top.tax, 1);
    if (selectedMetric === 'DISCOUNT') return Math.max(top.discount, 1);
    if (selectedMetric === 'AOV') return Math.max(top.avg_bill_value, 1);
    return Math.max(top.net_sales, 1);
  }, [sortedData, selectedMetric]);

  // Overall metric total for calculating percentage share
  const metricTotal = useMemo(() => {
    if (selectedMetric === 'BILLS') return totals.total_bills || 1;
    if (selectedMetric === 'QTY') return totals.total_qty || 1;
    if (selectedMetric === 'TAX') return totals.total_tax || 1;
    if (selectedMetric === 'DISCOUNT') return totals.total_discount || 1;
    if (selectedMetric === 'NET_SALES') return totals.net_sales || 1;
    return 1;
  }, [totals, selectedMetric]);

  const getMetricVal = (item: BranchWiseSalesItem) => {
    if (selectedMetric === 'BILLS') return item.bill_count;
    if (selectedMetric === 'QTY') return item.total_qty;
    if (selectedMetric === 'TAX') return item.tax;
    if (selectedMetric === 'DISCOUNT') return item.discount;
    if (selectedMetric === 'AOV') return item.avg_bill_value;
    return item.net_sales;
  };

  const formatMetricVal = (val: number) => {
    if (selectedMetric === 'BILLS') return `${formatNumber(val)} bills`;
    if (selectedMetric === 'QTY') return `${formatNumber(val)} units`;
    return formatCurrency(val);
  };

  const getMetricLabel = () => {
    if (selectedMetric === 'BILLS') return 'Bill Count';
    if (selectedMetric === 'QTY') return 'Units Sold';
    if (selectedMetric === 'TAX') return 'GST Tax Amount';
    if (selectedMetric === 'DISCOUNT') return 'Discounts';
    if (selectedMetric === 'AOV') return 'Avg Bill Value (AOV)';
    return 'Net Sales';
  };

  return (
    <View style={styles.chartContainer}>
      {/* Metric Selector Tab Row */}
      <View style={styles.selectorSection}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Select Chart Visualization Metric:
        </Text>
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
              selectedMetric === 'QTY' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('QTY')}
          >
            <ShoppingBag size={12} color={selectedMetric === 'QTY' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'QTY' ? '#ffffff' : theme.textSecondary }]}>
              Total Qty
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'AOV' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('AOV')}
          >
            <Award size={12} color={selectedMetric === 'AOV' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'AOV' ? '#ffffff' : theme.textSecondary }]}>
              Avg Bill (AOV)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'TAX' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('TAX')}
          >
            <Receipt size={12} color={selectedMetric === 'TAX' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'TAX' ? '#ffffff' : theme.textSecondary }]}>
              GST Tax
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
              Discounts
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Graphical Visual Comparison Card */}
      <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        {/* Chart Card Header */}
        <View style={[styles.chartHeader, isMobile && { flexDirection: 'column', gap: 6 }, { borderBottomColor: theme.divider }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BarChart3 size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                Branch Comparison: {getMetricLabel()}
              </Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
              Graphical performance ranking across {sortedData.length} store(s)
            </Text>
          </View>

          {sortedData.length > 0 && (
            <View style={[styles.topRankBadge, { backgroundColor: isDark ? '#3f2c00' : '#fef9c3', borderColor: '#fef08a' }]}>
              <Trophy size={12} color="#ca8a04" style={{ marginRight: 4 }} />
              <Text style={[styles.topRankBadgeText, { color: '#a16207' }]}>
                #1 {sortedData[0].branch_name}
              </Text>
            </View>
          )}
        </View>

        {/* Visual Bar Chart Rows */}
        <View style={styles.chartRowsContainer}>
          {sortedData.map((item, idx) => {
            const val = getMetricVal(item);
            const barPct = maxValue > 0 ? Math.min(100, Math.max(4, (val / maxValue) * 100)) : 0;
            const sharePct = selectedMetric !== 'AOV' && metricTotal > 0 ? (val / metricTotal) * 100 : 0;

            let barColor = theme.primary;
            let rankPillBg = isDark ? '#334155' : '#f1f5f9';
            let rankPillText = theme.textPrimary;
            let rankIcon = null;

            if (idx === 0) {
              barColor = '#eab308';
              rankPillBg = '#fef08a';
              rankPillText = '#854d0e';
              rankIcon = '🏆';
            } else if (idx === 1) {
              barColor = '#64748b';
              rankPillBg = '#e2e8f0';
              rankPillText = '#334155';
              rankIcon = '🥈';
            } else if (idx === 2) {
              barColor = '#f97316';
              rankPillBg = '#ffedd5';
              rankPillText = '#9a3412';
              rankIcon = '🥉';
            }

            return (
              <View key={item.branch_code || idx} style={styles.chartRow}>
                {/* Store Header & Rank */}
                <View style={styles.storeHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 6 }}>
                    <View style={[styles.rankBadgeMini, { backgroundColor: rankPillBg }]}>
                      <Text style={[styles.rankBadgeMiniText, { color: rankPillText }]}>
                        {rankIcon ? `${rankIcon} #${idx + 1}` : `#${idx + 1}`}
                      </Text>
                    </View>
                    <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.branch_name}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricValText, { color: idx === 0 ? '#ca8a04' : theme.textPrimary }]}>
                      {formatMetricVal(val)}
                    </Text>
                    {selectedMetric !== 'AOV' && (
                      <Text style={[styles.sharePctText, { color: theme.textMuted }]}>
                        {sharePct.toFixed(1)}% of total
                      </Text>
                    )}
                  </View>
                </View>

                {/* Graphical Visual Bar Track */}
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

        {/* Store Financial Breakdown Graphical Matrix */}
        <View style={[styles.matrixCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.matrixTitle, { color: theme.textSecondary }]}>
            Taxable Base vs GST Tax Ratio
          </Text>

          {sortedData.map((item) => {
            const sales = item.net_sales || 1;
            const taxPct = (item.tax / sales) * 100;

            return (
              <View key={`matrix-${item.branch_code}`} style={styles.matrixRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.matrixStoreText, { color: theme.textPrimary }]} numberOfLines={1}>
                    {item.branch_name}
                  </Text>
                  <Text style={[styles.matrixSubText, { color: theme.textMuted }]}>
                    Tax: {formatCurrency(item.tax)} ({taxPct.toFixed(1)}%)
                  </Text>
                </View>

                {/* Stacked Component Progress Track */}
                <View style={styles.stackedBarContainer}>
                  <View style={[styles.stackedTrack, { backgroundColor: theme.subtleBoxBg }]}>
                    <View style={[styles.stackedFill, { width: `${Math.min(100, Math.max(5, (item.taxable_amount / sales) * 100))}%`, backgroundColor: theme.primary }]} />
                  </View>
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
  rankBadgeMini: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  rankBadgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
  },
  storeNameText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  metricValText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sharePctText: {
    fontSize: 10,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  matrixCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
    gap: 8,
  },
  matrixTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  matrixRow: {
    gap: 3,
  },
  matrixStoreText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  stackedBarContainer: {
    gap: 2,
  },
  stackedTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  stackedFill: {
    height: '100%',
    borderRadius: 3,
  },
  matrixSubText: {
    fontSize: 10,
  },
});
