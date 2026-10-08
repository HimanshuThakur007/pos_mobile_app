import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { BranchSelectorModal } from '../components/modals/BranchSelectorModal';
import { UnifiedTopFilterBar } from '../components/common/UnifiedTopFilterBar';
import { UnifiedFilterModal } from '../components/common/UnifiedFilterModal';
import { StoreSelectionTriggerBadge } from '../components/common/StoreSelectionTriggerBadge';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import {
  fetchBranchWiseSales,
  BranchWiseSalesItem,
  BranchWiseSalesTotals,
} from '../api/branchSalesApi';
import { fetchBranches, BranchItem } from '../api/comparisonApi';
import {
  formatCurrency,
  formatNumber,
  getStoreFilterLabel,
} from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  Building2,
  Trophy,
} from 'lucide-react-native';

export const BranchWiseSalesMatrixScreen: React.FC<{ navigation?: any }> = () => {
  const { width } = useWindowDimensions();
  const { theme, isDark } = useTheme();

  // Global Filter State
  const {
    fromDate,
    toDate,
    selectedPreset,
    selectedBranchCodes,
    isFilterModalOpen,
    openFilterModal,
    closeFilterModal,
    setFromDate,
    setToDate,
    applyPreset,
    resetFilters,
    setSelectedBranchCodes,
  } = useGlobalFilter();

  // Screen Local State
  const [records, setRecords] = useState<BranchWiseSalesItem[]>([]);
  const [totals, setTotals] = useState<BranchWiseSalesTotals | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load available branches list from API on mount
  useEffect(() => {
    fetchBranches()
      .then((res) => {
        if (res.data && res.data.length > 0) setBranches(res.data);
      })
      .catch(() => {});
  }, []);

  // Main Data Loading Callback
  const loadData = useCallback(
    async (
      overrideBranches?: string[],
      overrideFrom?: string,
      overrideTo?: string,
      showFeedback = false
    ) => {
      setIsLoading(true);
      setErrorMessage(null);

      const targetFrom = overrideFrom !== undefined ? overrideFrom : fromDate;
      const targetTo = overrideTo !== undefined ? overrideTo : toDate;
      const targetBranchCodes = overrideBranches !== undefined ? overrideBranches : selectedBranchCodes;

      const params = {
        from_date: targetFrom,
        to_date: targetTo,
        branch_code: targetBranchCodes.length > 0 ? targetBranchCodes.join(',') : undefined,
      };

      const result = await fetchBranchWiseSales(params);

      if (result.isLive && Array.isArray(result.data)) {
        setRecords(result.data);
        setTotals(result.totals || null);
        setErrorMessage(null);
      } else {
        setRecords([]);
        setTotals(null);
        const errStr = result.error || 'Failed to connect to live branch sales API.';
        setErrorMessage(errStr);
        if (showFeedback) {
          Alert.alert('API Error', errStr);
        }
      }

      setIsLoading(false);
    },
    [fromDate, toDate, selectedBranchCodes]
  );

  const isFocused = useIsFocused();
  const lastFilterKeyRef = useRef<string>('');
  const currentFilterKey = `${fromDate}_${toDate}_${selectedBranchCodes.join(',')}`;

  // React to global filter changes & initial mount when focused
  useEffect(() => {
    if (isFocused && lastFilterKeyRef.current !== currentFilterKey) {
      lastFilterKeyRef.current = currentFilterKey;
      loadData();
    }
  }, [isFocused, currentFilterKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter Store Records by Search
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) => r.branch_name.toLowerCase().includes(q) || r.branch_code.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  // Computed totals
  const networkTotalSales = useMemo(() => {
    if (totals?.net_sales) return totals.net_sales;
    return records.reduce((acc, r) => acc + (r.net_sales || 0), 0);
  }, [records, totals]);

  const networkABV = useMemo(() => {
    const totalB = totals?.total_bills || records.reduce((acc, r) => acc + (r.bill_count || 0), 0);
    if (totalB > 0) return Math.round(networkTotalSales / totalB);
    return 0;
  }, [networkTotalSales, totals, records]);

  // ── Rank badge helper ──
  const renderRankBadge = (rank: number) => {
    let bg = isDark ? '#334155' : '#f1f5f9';
    let border = theme.border;
    let color = theme.textSecondary;
    let label = `#${rank}`;

    if (rank === 1) { bg = '#fef3c7'; border = '#f59e0b'; color = '#b45309'; label = '🥇 #1'; }
    else if (rank === 2) { bg = '#f1f5f9'; border = '#94a3b8'; color = '#475569'; label = '🥈 #2'; }
    else if (rank === 3) { bg = '#ffedd5'; border = '#f97316'; color = '#c2410c'; label = '🥉 #3'; }

    return (
      <View style={[styles.rankBadge, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.rankBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  // ── Metric Cell component (reusable mini block) ──
  const MetricCell = ({ label, value, valueColor, small }: { label: string; value: string; valueColor?: string; small?: boolean }) => (
    <View style={styles.metricCell}>
      <Text style={[styles.metricCellLabel, { color: theme.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[
          small ? styles.metricCellValueSm : styles.metricCellValue,
          { color: valueColor || theme.textPrimary },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {value}
      </Text>
    </View>
  );

  // ── Waterfall Row (arrow-connected value flow) ──
  const WaterfallRow = ({ label, value, isNegative, isHighlight }: { label: string; value: number; isNegative?: boolean; isHighlight?: boolean }) => (
    <View style={styles.waterfallRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
        <View style={[styles.waterfallDot, { backgroundColor: isHighlight ? theme.primary : isNegative ? '#ef4444' : '#94a3b8' }]} />
        <Text style={[styles.waterfallLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text
        style={[
          styles.waterfallValue,
          {
            color: isHighlight ? theme.primary : isNegative ? '#ef4444' : theme.textPrimary,
            fontWeight: isHighlight ? '900' : '700',
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {isNegative && value > 0 ? `- ${formatCurrency(value)}` : formatCurrency(value)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Branch Sales Scorecard"
        subtitle={`Executive Matrix • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {/* Top Filter Bar */}
      <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
        <UnifiedTopFilterBar
          fromDate={fromDate}
          toDate={toDate}
          extraPills={[
            { icon: Building2, label: getStoreFilterLabel(selectedBranchCodes, branches) },
          ]}
          onToggleFilters={openFilterModal}
          onRefreshData={() => loadData()}
          showExport={false}
        />
      </View>

      {/* Main Content */}
      {isLoading && records.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading store sales scorecards...
          </Text>
        </View>
      ) : filteredRecords.length === 0 && !isLoading ? (
        <View style={styles.emptyBox}>
          <Trophy size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Store Sales Records</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Adjust date range or store filters to view sales scorecards.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={true}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {/* ────────────────────────────────────────────
              EXECUTIVE SUMMARY BANNER
          ──────────────────────────────────────────── */}
          <View style={[styles.summaryBanner, { backgroundColor: isDark ? '#0f172a' : '#eef2ff', borderColor: isDark ? '#334155' : '#c7d2fe' }]}>
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: isDark ? '#93c5fd' : '#4f46e5' }]}>
                  Network Net Sales
                </Text>
                <Text
                  style={[styles.summaryHeroValue, { color: isDark ? '#e0e7ff' : '#312e81' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {formatCurrency(networkTotalSales)}
                </Text>
              </View>
              <View style={[styles.summaryChip, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                <Text style={[styles.summaryChipText, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                  {totals?.total_stores || records.length} Stores
                </Text>
              </View>
            </View>
          </View>

          {/* ────────────────────────────────────────────
              6-KPI TOTALS GRID (3 cols × 2 rows)
          ──────────────────────────────────────────── */}
          <View style={styles.kpiSection}>
            {/* Row 1 */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Total Bills</Text>
                <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatNumber(totals?.total_bills || 0)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Avg Bill Value</Text>
                <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  ₹{formatNumber(networkABV)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Total Qty</Text>
                <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatNumber(totals?.total_qty || 0)}
                </Text>
              </View>
            </View>
            {/* Row 2 */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Gross Sales</Text>
                <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatCurrency(totals?.sales_amount || 0)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Discount</Text>
                <Text style={[styles.kpiValue, { color: '#ef4444' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatCurrency(totals?.total_discount || 0)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Tax Collected</Text>
                <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatCurrency(totals?.total_tax || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Store Search */}
          <View style={[styles.searchSection, { borderBottomColor: theme.border }]}>
            <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Search size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search store code or name..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>
            <Text style={[styles.storeCount, { color: theme.textMuted }]}>
              {filteredRecords.length} of {records.length} stores
            </Text>
          </View>

          {/* ────────────────────────────────────────────
              PER-STORE SCORECARD CARDS
          ──────────────────────────────────────────── */}
          <View style={styles.cardsContainer}>
            {filteredRecords.map((item, idx) => {
              const sharePct = networkTotalSales > 0
                ? ((item.net_sales / networkTotalSales) * 100).toFixed(1)
                : '0';
              const abv = item.avg_bill_value || (item.bill_count > 0 ? Math.round(item.net_sales / item.bill_count) : 0);
              const discountPct = item.sales_amount > 0
                ? ((item.discount / item.sales_amount) * 100).toFixed(1)
                : '0';
              const hasReturns = (item.return_bill_count || 0) > 0 || (item.return_qty || 0) > 0 || (item.return_amount || 0) > 0;

              return (
                <View
                  key={`${item.branch_code}-${idx}`}
                  style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                >
                  {/* ── Card Header ── */}
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      {renderRankBadge(item.rank)}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                          {item.branch_name}
                        </Text>
                        <Text style={[styles.cardCode, { color: theme.textMuted }]}>
                          Code: {item.branch_code}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.shareBadge, { backgroundColor: isDark ? '#1e3a8a44' : '#eff6ff', borderColor: theme.primary }]}>
                      <Text style={[styles.shareBadgeText, { color: theme.primary }]}>
                        {sharePct}%
                      </Text>
                    </View>
                  </View>

                  {/* ── Primary Metrics: 3-column row ── */}
                  <View style={[styles.primaryRow, { backgroundColor: isDark ? '#1e293b44' : '#f8fafc', borderColor: theme.border }]}>
                    <MetricCell label="Net Sales" value={formatCurrency(item.net_sales)} valueColor={theme.primary} />
                    <View style={[styles.primaryDivider, { backgroundColor: theme.border }]} />
                    <MetricCell label="Bills" value={formatNumber(item.bill_count)} />
                    <View style={[styles.primaryDivider, { backgroundColor: theme.border }]} />
                    <MetricCell label="ABV" value={`₹${formatNumber(abv)}`} />
                  </View>

                  {/* ── Items & Discount summary row ── */}
                  <View style={styles.inlineRow}>
                    <View style={styles.inlineItem}>
                      <Text style={[styles.inlineLabel, { color: theme.textMuted }]}>Items Sold</Text>
                      <Text style={[styles.inlineValue, { color: theme.textPrimary }]}>
                        {formatNumber(item.total_qty || 0)} pcs
                      </Text>
                    </View>
                    <View style={styles.inlineItem}>
                      <Text style={[styles.inlineLabel, { color: theme.textMuted }]}>Discount %</Text>
                      <Text style={[styles.inlineValue, { color: '#ef4444' }]}>
                        {discountPct}%
                      </Text>
                    </View>
                    <View style={styles.inlineItem}>
                      <Text style={[styles.inlineLabel, { color: theme.textMuted }]}>Rev Share</Text>
                      <Text style={[styles.inlineValue, { color: theme.primary }]}>
                        {sharePct}%
                      </Text>
                    </View>
                  </View>

                  {/* ── Sales Waterfall Breakdown ── */}
                  <View style={[styles.waterfallContainer, { borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                      Sales Breakdown
                    </Text>
                    <View style={[styles.waterfallLine, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                    <WaterfallRow label="Gross Sales" value={item.sales_amount} />
                    <WaterfallRow label="Discount" value={item.discount || 0} isNegative />
                    <WaterfallRow label="Taxable Amount" value={item.taxable_amount || 0} />
                    <WaterfallRow label="Tax Collected" value={item.tax || 0} />
                    <View style={[styles.waterfallDivider, { borderColor: theme.border }]} />
                    <WaterfallRow label="Net Sales" value={item.net_sales} isHighlight />
                  </View>

                  {/* ── Tax Split (SGST / CGST / IGST) ── */}
                  {(item.sgst > 0 || item.cgst > 0 || item.igst > 0) && (
                    <View style={[styles.taxSplitRow, { backgroundColor: isDark ? '#1e293b22' : '#f1f5f9', borderColor: theme.border }]}>
                      <View style={styles.taxSplitItem}>
                        <Text style={[styles.taxSplitLabel, { color: theme.textMuted }]}>SGST</Text>
                        <Text style={[styles.taxSplitValue, { color: theme.textSecondary }]}>
                          {formatCurrency(item.sgst)}
                        </Text>
                      </View>
                      <View style={[styles.taxSplitItem, { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
                        <Text style={[styles.taxSplitLabel, { color: theme.textMuted }]}>CGST</Text>
                        <Text style={[styles.taxSplitValue, { color: theme.textSecondary }]}>
                          {formatCurrency(item.cgst)}
                        </Text>
                      </View>
                      {item.igst > 0 && (
                        <View style={[styles.taxSplitItem, { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
                          <Text style={[styles.taxSplitLabel, { color: theme.textMuted }]}>IGST</Text>
                          <Text style={[styles.taxSplitValue, { color: theme.textSecondary }]}>
                            {formatCurrency(item.igst)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* ── Returns Section (conditional) ── */}
                  {hasReturns && (
                    <View style={[styles.returnsSection, { backgroundColor: isDark ? '#451a1a22' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}>
                      <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>
                        Returns
                      </Text>
                      <View style={styles.returnsGrid}>
                        <View style={styles.returnsItem}>
                          <Text style={[styles.returnsLabel, { color: '#b91c1c' }]}>Bills</Text>
                          <Text style={[styles.returnsValue, { color: '#dc2626' }]}>
                            {formatNumber(item.return_bill_count || 0)}
                          </Text>
                        </View>
                        <View style={styles.returnsItem}>
                          <Text style={[styles.returnsLabel, { color: '#b91c1c' }]}>Qty</Text>
                          <Text style={[styles.returnsValue, { color: '#dc2626' }]}>
                            {formatNumber(item.return_qty || 0)}
                          </Text>
                        </View>
                        <View style={styles.returnsItem}>
                          <Text style={[styles.returnsLabel, { color: '#b91c1c' }]}>Amount</Text>
                          <Text style={[styles.returnsValue, { color: '#dc2626' }]}>
                            {formatCurrency(item.return_amount || 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* ── Revenue Contribution Bar ── */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(Math.max(Number(sharePct), 3), 100)}%`,
                            backgroundColor: item.rank === 1 ? '#f59e0b' : item.rank <= 3 ? theme.primary : '#3b82f6',
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* UNIFIED FILTER MODAL */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Sales Scorecard Filters"
        selectedPreset={selectedPreset}
        fromDate={fromDate}
        toDate={toDate}
        onClose={closeFilterModal}
        onApplyPreset={applyPreset}
        onSelectDate={(newDate: string, target: 'FROM' | 'TO') => {
          if (target === 'FROM') setFromDate(newDate);
          else setToDate(newDate);
        }}
        onApply={() => loadData()}
        onReset={resetFilters}
      >
        <StoreSelectionTriggerBadge
          selectedBranchCodes={selectedBranchCodes}
          branches={branches}
          onPress={() => {
            closeFilterModal();
            setIsBranchModalOpen(true);
          }}
        />
      </UnifiedFilterModal>

      {/* STANDALONE BRANCH SELECTOR MODAL */}
      <BranchSelectorModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        selectedBranchCodes={selectedBranchCodes}
        onApply={(newCodes) => {
          setSelectedBranchCodes(newCodes);
          loadData(newCodes);
        }}
        title="Select Stores for Scorecard"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Loading / Empty ──
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Executive Summary Banner ──
  summaryBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryHeroValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  summaryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // ── KPI Grid ──
  kpiSection: {
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 6,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
  },
  kpiCard: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Search ──
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    paddingVertical: 0,
  },
  storeCount: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Store Cards ──
  cardsContainer: {
    padding: 12,
    gap: 12,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardCode: {
    fontSize: 10,
    marginTop: 1,
  },
  rankBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  shareBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  shareBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Primary Metrics Row ──
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  primaryDivider: {
    width: 1,
    alignSelf: 'stretch',
  },

  // ── Metric Cell ──
  metricCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  metricCellLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  metricCellValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricCellValueSm: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Inline Row (Items / Discount% / Rev Share) ──
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineItem: {
    flex: 1,
  },
  inlineLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inlineValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },

  // ── Sales Waterfall ──
  waterfallContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  waterfallLine: {
    height: 1,
    marginBottom: 2,
  },
  waterfallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waterfallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  waterfallLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  waterfallValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  waterfallDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 2,
  },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Tax Split Row ──
  taxSplitRow: {
    flexDirection: 'row',
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 6,
  },
  taxSplitItem: {
    flex: 1,
    alignItems: 'center',
  },
  taxSplitLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  taxSplitValue: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },

  // ── Returns Section ──
  returnsSection: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  returnsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  returnsItem: {
    flex: 1,
  },
  returnsLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  returnsValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },

  // ── Progress Bar ──
  progressContainer: {
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
