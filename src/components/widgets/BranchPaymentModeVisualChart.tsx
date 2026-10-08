import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Trophy, BarChart3, CreditCard, Banknote, QrCode, Layers, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BranchPaymentModeItem, BranchPaymentModeTotals } from '../../api/branchPaymentModeApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export type PaymentChartMetric = 'AMOUNT' | 'TXN_COUNT';

interface BranchPaymentModeVisualChartProps {
  records: BranchPaymentModeItem[];
  totals: BranchPaymentModeTotals;
}

export const BranchPaymentModeVisualChart: React.FC<BranchPaymentModeVisualChartProps> = ({
  records,
  totals,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const [selectedMetric, setSelectedMetric] = useState<PaymentChartMetric>('AMOUNT');
  const [groupBy, setGroupBy] = useState<'MODE' | 'STORE'>('MODE');

  // Group items by Mode or by Store
  const chartItems = useMemo(() => {
    if (groupBy === 'MODE') {
      const modeMap: Record<string, { label: string; mode: string; amount: number; txn_count: number }> = {};

      records.forEach((r) => {
        const key = r.mode.toUpperCase();
        if (!modeMap[key]) {
          modeMap[key] = {
            label: key,
            mode: r.mode,
            amount: 0,
            txn_count: 0,
          };
        }
        modeMap[key].amount += r.amount;
        modeMap[key].txn_count += r.txn_count;
      });

      return Object.values(modeMap).sort((a, b) => b.amount - a.amount);
    } else {
      const storeMap: Record<string, { label: string; mode: string; amount: number; txn_count: number }> = {};

      records.forEach((r) => {
        const key = r.branch_code;
        if (!storeMap[key]) {
          storeMap[key] = {
            label: r.branch_name || `Store #${r.branch_code}`,
            mode: 'STORE',
            amount: 0,
            txn_count: 0,
          };
        }
        storeMap[key].amount += r.amount;
        storeMap[key].txn_count += r.txn_count;
      });

      return Object.values(storeMap).sort((a, b) => b.amount - a.amount);
    }
  }, [records, groupBy]);

  const getMetricVal = (item: any) => {
    if (selectedMetric === 'TXN_COUNT') return item.txn_count;
    return item.amount;
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
    if (selectedMetric === 'TXN_COUNT') return totals.total_txns || 1;
    return totals.total_amount || 1;
  }, [totals, selectedMetric]);

  const formatMetricVal = (val: number) => {
    if (selectedMetric === 'TXN_COUNT') return `${formatNumber(val)} txns`;
    return formatCurrency(val);
  };

  const getModeIcon = (modeStr: string) => {
    const m = modeStr.toLowerCase();
    if (m.includes('cash')) return <Banknote size={14} color="#16a34a" style={{ marginRight: 6 }} />;
    if (m.includes('card')) return <CreditCard size={14} color="#2563eb" style={{ marginRight: 6 }} />;
    if (m.includes('upi') || m.includes('qr') || m.includes('online')) return <QrCode size={14} color="#9333ea" style={{ marginRight: 6 }} />;
    return <ShieldCheck size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />;
  };

  return (
    <View style={styles.chartContainer}>
      {/* Grouping & Metric Selectors */}
      <View style={styles.selectorSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Payment Modes Split Visualization
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[
                styles.groupChip,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                groupBy === 'MODE' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setGroupBy('MODE')}
            >
              <Text style={[styles.groupChipText, { color: groupBy === 'MODE' ? '#ffffff' : theme.textSecondary }]}>
                By Payment Mode
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
              selectedMetric === 'AMOUNT' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('AMOUNT')}
          >
            <CreditCard size={12} color={selectedMetric === 'AMOUNT' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'AMOUNT' ? '#ffffff' : theme.textSecondary }]}>
              Collection Amount
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
              selectedMetric === 'TXN_COUNT' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedMetric('TXN_COUNT')}
          >
            <Layers size={12} color={selectedMetric === 'TXN_COUNT' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.metricChipText, { color: selectedMetric === 'TXN_COUNT' ? '#ffffff' : theme.textSecondary }]}>
              Transaction Count
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
                Payment Breakdown: {selectedMetric === 'AMOUNT' ? 'Amount' : 'Transactions'}
              </Text>
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
              {groupBy === 'MODE' ? `Collection share per payment channel` : `Payment totals per store`}
            </Text>
          </View>

          {totals?.top_mode && totals.top_mode !== 'NONE' && (
            <View style={[styles.topRankBadge, { backgroundColor: isDark ? '#3f2c00' : '#fef9c3', borderColor: '#fef08a' }]}>
              <Trophy size={12} color="#ca8a04" style={{ marginRight: 4 }} />
              <Text style={[styles.topRankBadgeText, { color: '#a16207' }]}>
                Top Mode: {totals.top_mode}
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

            const mLower = item.label.toLowerCase();
            let barColor = theme.primary;
            if (mLower.includes('cash')) barColor = '#16a34a';
            else if (mLower.includes('card')) barColor = '#2563eb';
            else if (mLower.includes('upi') || mLower.includes('qr') || mLower.includes('online')) barColor = '#9333ea';
            else if (idx === 0) barColor = '#eab308';

            return (
              <View key={item.label + '-' + idx} style={styles.chartRow}>
                <View style={styles.storeHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 6 }}>
                    {groupBy === 'MODE' && getModeIcon(item.label)}
                    <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricValText, { color: theme.textPrimary }]}>
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
