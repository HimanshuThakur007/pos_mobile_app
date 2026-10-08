import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Scale,
  Percent,
  IndianRupee,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  StoreSalesPeriodComparisonItem,
  StoreSalesPeriodComparisonTotals,
  StoreSalesPeriodComparisonMeta,
  PeriodComparisonType,
  formatDateRangeText,
} from '../../api/storeSalesPeriodComparisonApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export type ChartMode = 'SALES_COMPARISON' | 'GROWTH_LEADERBOARD';

interface StoreSalesPeriodComparisonVisualChartProps {
  records: StoreSalesPeriodComparisonItem[];
  totals: StoreSalesPeriodComparisonTotals;
  period: PeriodComparisonType;
  meta?: StoreSalesPeriodComparisonMeta | null;
}

export const StoreSalesPeriodComparisonVisualChart: React.FC<StoreSalesPeriodComparisonVisualChartProps> = ({
  records,
  totals,
  period,
  meta,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const [chartMode, setChartMode] = useState<ChartMode>('SALES_COMPARISON');

  const periodLabels: Record<PeriodComparisonType, { current: string; previous: string }> = {
    month_vs_month: { current: 'Current Month', previous: 'Previous Month' },
    week_vs_week: { current: 'Current Week', previous: 'Previous Week' },
    today_vs_yesterday: { current: 'Today', previous: 'Yesterday' },
  };

  const currentLabel = periodLabels[period]?.current || 'Current Period';
  const prevLabel = periodLabels[period]?.previous || 'Previous Period';

  // Sort according to active view mode
  const sortedRecords = useMemo(() => {
    if (chartMode === 'GROWTH_LEADERBOARD') {
      return [...records].sort((a, b) => b.growth_pct - a.growth_pct);
    }
    // SALES_COMPARISON: sort by current net sales or previous net sales
    return [...records].sort((a, b) => Math.max(b.current_net_sales, b.previous_net_sales) - Math.max(a.current_net_sales, a.previous_net_sales));
  }, [records, chartMode]);

  // Max sales for bar proportions
  const maxSales = useMemo(() => {
    if (records.length === 0) return 1;
    let max = 1;
    records.forEach((r) => {
      if (r.current_net_sales > max) max = r.current_net_sales;
      if (r.previous_net_sales > max) max = r.previous_net_sales;
    });
    return max;
  }, [records]);

  // Max absolute growth pct for leaderboard bar proportions
  const maxGrowthPct = useMemo(() => {
    if (records.length === 0) return 100;
    let max = 10;
    records.forEach((r) => {
      const abs = Math.abs(r.growth_pct);
      if (abs > max) max = abs;
    });
    return max;
  }, [records]);

  return (
    <View style={styles.container}>
      {/* Mode Selector Row */}
      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[
            styles.modeChip,
            { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
            chartMode === 'SALES_COMPARISON' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => setChartMode('SALES_COMPARISON')}
          activeOpacity={0.8}
        >
          <Scale size={13} color={chartMode === 'SALES_COMPARISON' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.modeChipText, { color: chartMode === 'SALES_COMPARISON' ? '#ffffff' : theme.textSecondary }]}>
            Comparative Bars (₹)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeChip,
            { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
            chartMode === 'GROWTH_LEADERBOARD' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => setChartMode('GROWTH_LEADERBOARD')}
          activeOpacity={0.8}
        >
          <Percent size={13} color={chartMode === 'GROWTH_LEADERBOARD' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.modeChipText, { color: chartMode === 'GROWTH_LEADERBOARD' ? '#ffffff' : theme.textSecondary }]}>
            Growth Leaderboard (%)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Chart Card */}
      <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        {/* Header with Legend */}
        <View style={[styles.chartHeader, { borderBottomColor: theme.divider }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BarChart3 size={16} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                {chartMode === 'SALES_COMPARISON' ? 'Period-on-Period Revenue Split' : 'Store Growth Ranking'}
              </Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
              {chartMode === 'SALES_COMPARISON'
                ? meta
                  ? `${currentLabel} (${formatDateRangeText(meta.current_range)}) vs ${prevLabel} (${formatDateRangeText(meta.previous_range)})`
                  : `Comparing ${currentLabel} vs ${prevLabel} sales per store`
                : meta
                ? `Store growth ranking comparing ${formatDateRangeText(meta.current_range)} vs ${formatDateRangeText(meta.previous_range)}`
                : 'Ranked from highest positive growth to biggest variance'}
            </Text>
          </View>

          {chartMode === 'SALES_COMPARISON' && (
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>{currentLabel}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: isDark ? '#64748b' : '#94a3b8' }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>{prevLabel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Content list */}
        <View style={styles.chartRowsList}>
          {sortedRecords.map((item, idx) => {
            const isPositive = item.growth_pct > 0;
            const isNeutral = item.growth_pct === 0;

            if (chartMode === 'SALES_COMPARISON') {
              const currentBarWidth = maxSales > 0 ? Math.min(100, Math.max(3, (item.current_net_sales / maxSales) * 100)) : 0;
              const prevBarWidth = maxSales > 0 ? Math.min(100, Math.max(3, (item.previous_net_sales / maxSales) * 100)) : 0;

              return (
                <View key={`comp-${item.branch_code}-${idx}`} style={styles.salesCompRow}>
                  {/* Store info line */}
                  <View style={styles.storeLine}>
                    <Text style={[styles.storeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.branch_name}
                    </Text>
                    <View
                      style={[
                        styles.growthBadge,
                        {
                          backgroundColor: isPositive
                            ? isDark ? '#064e3b' : '#dcfce7'
                            : isNeutral
                            ? isDark ? '#334155' : '#f1f5f9'
                            : isDark ? '#7f1d1d' : '#fee2e2',
                        },
                      ]}
                    >
                      {isPositive ? (
                        <ArrowUpRight size={12} color={isDark ? '#4ade80' : '#16a34a'} />
                      ) : isNeutral ? null : (
                        <ArrowDownRight size={12} color={isDark ? '#f87171' : '#dc2626'} />
                      )}
                      <Text
                        style={[
                          styles.growthBadgeText,
                          {
                            color: isPositive
                              ? isDark ? '#4ade80' : '#16a34a'
                              : isNeutral
                              ? theme.textSecondary
                              : isDark ? '#f87171' : '#dc2626',
                          },
                        ]}
                      >
                        {item.growth_pct > 0 ? `+${item.growth_pct}%` : `${item.growth_pct}%`}
                      </Text>
                    </View>
                  </View>

                  {/* Dual comparative progress tracks */}
                  <View style={styles.dualBarContainer}>
                    {/* Current Sales Bar */}
                    <View style={styles.singleBarRow}>
                      <View style={styles.barLabelBox}>
                        <Text style={[styles.barPeriodLabel, { color: theme.primary }]}>Cur</Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: theme.subtleBoxBg }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${currentBarWidth}%`,
                              backgroundColor: theme.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barValText, { color: theme.primary }]}>
                        {formatCurrency(item.current_net_sales)}
                      </Text>
                    </View>

                    {/* Previous Sales Bar */}
                    <View style={styles.singleBarRow}>
                      <View style={styles.barLabelBox}>
                        <Text style={[styles.barPeriodLabel, { color: theme.textMuted }]}>Prev</Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: theme.subtleBoxBg }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${prevBarWidth}%`,
                              backgroundColor: isDark ? '#64748b' : '#94a3b8',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barValText, { color: theme.textSecondary }]}>
                        {formatCurrency(item.previous_net_sales)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }

            // GROWTH_LEADERBOARD MODE
            const absGrowth = Math.abs(item.growth_pct);
            const barWidth = maxGrowthPct > 0 ? Math.min(100, Math.max(5, (absGrowth / maxGrowthPct) * 100)) : 0;
            const barColor = isPositive ? (isDark ? '#4ade80' : '#16a34a') : isNeutral ? '#94a3b8' : (isDark ? '#f87171' : '#dc2626');

            return (
              <View key={`growth-${item.branch_code}-${idx}`} style={styles.growthRow}>
                <View style={styles.storeLine}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.rankNumber, { color: theme.textMuted }]}>#{idx + 1}</Text>
                    <Text style={[styles.storeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.branch_name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.growthLeaderText,
                      { color: isPositive ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#f87171' : '#dc2626') },
                    ]}
                  >
                    {item.growth_pct > 0 ? `+${item.growth_pct}%` : `${item.growth_pct}%`}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={[styles.barTrack, { backgroundColor: theme.subtleBoxBg, height: 8 }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>

                {/* Amount details line */}
                <View style={styles.growthSubLine}>
                  <Text style={[styles.growthSubText, { color: theme.textMuted }]}>
                    Cur: {formatCurrency(item.current_net_sales)} | Prev: {formatCurrency(item.previous_net_sales)}
                  </Text>
                  <Text
                    style={[
                      styles.growthSubDiff,
                      { color: item.growth_amount >= 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#f87171' : '#dc2626') },
                    ]}
                  >
                    {item.growth_amount >= 0 ? `+${formatCurrency(item.growth_amount)}` : formatCurrency(item.growth_amount)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Aggregated Portfolio Growth Bar */}
        <View style={[styles.portfolioSummaryCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Layers size={14} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.portfolioTitle, { color: theme.textPrimary }]}>
                Overall Portfolio Growth Rate
              </Text>
            </View>
            <Text
              style={[
                styles.portfolioGrowthRate,
                {
                  color: totals.total_growth_pct >= 0
                    ? isDark ? '#4ade80' : '#16a34a'
                    : isDark ? '#f87171' : '#dc2626',
                },
              ]}
            >
              {totals.total_growth_pct >= 0 ? `+${totals.total_growth_pct}%` : `${totals.total_growth_pct}%`}
            </Text>
          </View>
          <Text style={[styles.portfolioSub, { color: theme.textMuted }]}>
            Total Variance: {totals.total_growth_amount >= 0 ? `+${formatCurrency(totals.total_growth_amount)}` : formatCurrency(totals.total_growth_amount)} across {records.length} stores
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeChipText: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '800',
  },
  chartSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chartRowsList: {
    gap: 14,
  },
  salesCompRow: {
    gap: 6,
  },
  growthRow: {
    gap: 4,
  },
  storeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankNumber: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },
  storeTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  growthBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  growthLeaderText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dualBarContainer: {
    gap: 4,
  },
  singleBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabelBox: {
    width: 28,
  },
  barPeriodLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  barValText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
  growthSubLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  growthSubText: {
    fontSize: 10,
  },
  growthSubDiff: {
    fontSize: 11,
    fontWeight: '700',
  },
  portfolioSummaryCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
    gap: 4,
  },
  portfolioTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  portfolioGrowthRate: {
    fontSize: 14,
    fontWeight: '800',
  },
  portfolioSub: {
    fontSize: 10,
  },
});
