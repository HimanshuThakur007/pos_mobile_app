import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  FlatList,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { BranchSelectorModal } from '../components/modals/BranchSelectorModal';
import { UnifiedTopFilterBar } from '../components/common/UnifiedTopFilterBar';
import { UnifiedFilterModal } from '../components/common/UnifiedFilterModal';
import { StoreSelectionTriggerBadge } from '../components/common/StoreSelectionTriggerBadge';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import { Badge } from '../components/Badge';
import {
  fetchBranchWiseSales,
  BranchWiseSalesItem,
  BranchWiseSalesTotals,
  BranchWiseSalesMeta,
} from '../api/branchSalesApi';
import { fetchBranches, BranchItem } from '../api/comparisonApi';
import { getStoreFilterLabel } from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import {
  Trophy,
  Search,
  Building2,
  AlertTriangle,
  TrendingUp,
  X,
  ChevronDown,
  CreditCard,
  Receipt,
  Layers,
  Award,
  Sparkles,
} from 'lucide-react-native';

const INITIAL_PAGE_SIZE = 15;

type SortOption = 'NET_SALES' | 'BILLS' | 'QTY' | 'AOV' | 'DISCOUNT' | 'TAX';

const formatCurrencyNoDecimals = (val: number | string | null | undefined): string => {
  const num = Number(val || 0);
  if (isNaN(num)) return '₹0';
  return '₹' + Math.round(num).toLocaleString('en-IN');
};

const formatNumber = (val: number | string | null | undefined): string => {
  const num = Number(val || 0);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
};

export const BranchWiseSalesScreen: React.FC<{ navigation?: any }> = () => {
  const { theme, isDark } = useTheme();

  // Consume Global Filter Context
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
    setSelectedBranchCodes,
    applyPreset,
    resetFilters,
  } = useGlobalFilter();

  // Branch Selection State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Search & Sorting State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('NET_SALES');
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE);

  // Data state
  const [records, setRecords] = useState<BranchWiseSalesItem[]>([]);
  const [totals, setTotals] = useState<BranchWiseSalesTotals | null>(null);
  const [meta, setMeta] = useState<BranchWiseSalesMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load available branches list from API on mount
  useEffect(() => {
    const loadBranchList = async () => {
      const res = await fetchBranches();
      if (res.data && res.data.length > 0) {
        setBranches(res.data);
      }
    };
    loadBranchList();
  }, []);

  // Main data loader function
  const loadData = useCallback(
    async (
      overrideFrom?: string,
      overrideTo?: string,
      overrideBranches?: string[]
    ) => {
      setIsLoading(true);
      setErrorMessage(null);

      const fDate = overrideFrom || fromDate;
      const tDate = overrideTo || toDate;
      const targetBranchCodes = overrideBranches !== undefined ? overrideBranches : selectedBranchCodes;
      const branchCodeParam = targetBranchCodes.join(',');

      const res = await fetchBranchWiseSales({
        from_date: fDate,
        to_date: tDate,
        branch_code: branchCodeParam,
      });

      if (res.isLive) {
        setRecords(res.data);
        if (res.totals) setTotals(res.totals);
        if (res.meta) setMeta(res.meta);
        closeFilterModal();
      } else {
        setRecords([]);
        setTotals(null);
        setMeta(null);
        setErrorMessage(res.error || 'Failed to fetch store sales ranking data.');
      }
      setIsLoading(false);
    },
    [fromDate, toDate, selectedBranchCodes]
  );

  const isFocused = useIsFocused();
  const lastFilterKeyRef = useRef<string>('');
  const currentFilterKey = `${fromDate}_${toDate}_${selectedBranchCodes.join(',')}`;

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

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const nameMatch = (item.branch_name || '').toLowerCase().includes(q);
        const codeMatch = String(item.branch_code || '').toLowerCase().includes(q);
        return nameMatch || codeMatch;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'NET_SALES') return b.net_sales - a.net_sales;
      if (sortBy === 'BILLS') return b.bill_count - a.bill_count;
      if (sortBy === 'QTY') return b.total_qty - a.total_qty;
      if (sortBy === 'AOV') return b.avg_bill_value - a.avg_bill_value;
      if (sortBy === 'DISCOUNT') return b.discount - a.discount;
      if (sortBy === 'TAX') return b.tax - a.tax;
      return 0;
    });

    return result;
  }, [records, searchQuery, sortBy]);

  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, displayLimit);
  }, [filteredRecords, displayLimit]);

  const loadMoreItems = () => {
    if (displayLimit < filteredRecords.length) {
      setDisplayLimit((prev) => prev + INITIAL_PAGE_SIZE);
    }
  };

  // Compute effective totals
  const effectiveTotals = useMemo(() => {
    if (totals) {
      const billCount = totals.total_bills || 0;
      const netSales = totals.net_sales || 0;
      return {
        net_sales: netSales,
        bill_count: billCount,
        total_qty: totals.total_qty || 0,
        avg_bill_value: billCount > 0 ? netSales / billCount : 0,
        sales_amount: totals.sales_amount || 0,
        return_amount: totals.return_amount || 0,
        return_bill_count: totals.return_bills || 0,
      };
    }

    let net_sales = 0;
    let bill_count = 0;
    let total_qty = 0;
    let sales_amount = 0;
    let return_amount = 0;
    let return_bill_count = 0;

    records.forEach((r) => {
      net_sales += r.net_sales || 0;
      bill_count += r.bill_count || 0;
      total_qty += r.total_qty || 0;
      sales_amount += r.sales_amount || 0;
      return_amount += r.return_amount || 0;
      return_bill_count += r.return_bill_count || 0;
    });

    const avg_bill_value = bill_count > 0 ? net_sales / bill_count : 0;

    return {
      net_sales,
      bill_count,
      total_qty,
      avg_bill_value,
      sales_amount,
      return_amount,
      return_bill_count,
    };
  }, [totals, records]);

  // Render Header Component with KPI Chips
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <UnifiedTopFilterBar
        fromDate={fromDate}
        toDate={toDate}
        extraPills={[{ icon: Building2, label: getStoreFilterLabel(selectedBranchCodes, branches) }]}
        onToggleFilters={openFilterModal}
        onRefreshData={() => loadData()}
        showExport={false}
      />

      {/* KPI Chips Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
        <View style={styles.kpiWrap}>
          <View style={[styles.kpiChip, { backgroundColor: isDark ? '#1e293b' : '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <View style={[styles.iconWrap, { backgroundColor: '#d1fae5' }]}>
              <TrendingUp size={14} color="#059669" />
            </View>
            <View>
              <Text style={[styles.kLabel, { color: '#047857' }]}>NETWORK REVENUE</Text>
              <Text style={[styles.kValue, { color: '#065f46' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {formatCurrencyNoDecimals(effectiveTotals.net_sales)}
              </Text>
            </View>
          </View>

          <View style={[styles.kpiChip, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#bfdbfe' }]}>
            <View style={[styles.iconWrap, { backgroundColor: '#dbeafe' }]}>
              <Receipt size={14} color="#1d4ed8" />
            </View>
            <View>
              <Text style={[styles.kLabel, { color: '#1e40af' }]}>TOTAL BILLS</Text>
              <Text style={[styles.kValue, { color: '#1e3a8a' }]}>
                {formatNumber(effectiveTotals.bill_count)}
              </Text>
            </View>
          </View>

          <View style={[styles.kpiChip, { backgroundColor: isDark ? '#1e293b' : '#f5f3ff', borderColor: '#ddd6fe' }]}>
            <View style={[styles.iconWrap, { backgroundColor: '#ede9fe' }]}>
              <Layers size={14} color="#7e22ce" />
            </View>
            <View>
              <Text style={[styles.kLabel, { color: '#6b21a8' }]}>AVG BILL VALUE</Text>
              <Text style={[styles.kValue, { color: '#581c87' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {formatCurrencyNoDecimals(effectiveTotals.avg_bill_value)}
              </Text>
            </View>
          </View>

          <View style={[styles.kpiChip, { backgroundColor: isDark ? '#1e293b' : '#fff7ed', borderColor: '#fed7aa' }]}>
            <View style={[styles.iconWrap, { backgroundColor: '#ffedd5' }]}>
              <Award size={14} color="#c55a11" />
            </View>
            <View>
              <Text style={[styles.kLabel, { color: '#c55a11' }]}>STORES COUNT</Text>
              <Text style={[styles.kValue, { color: '#9a3412' }]}>
                {records.length} Stores
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
        <Search size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search store code or name..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={14} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  // Render Each Store Ranking Card (Matching Day Wise Store Sale and Department Target card design)
  const renderItem = ({ item, index }: { item: BranchWiseSalesItem; index: number }) => {
    const rank = item.rank || index + 1;
    const branchName = item.branch_name || `Store ${item.branch_code}`;
    const branchCode = item.branch_code || 'N/A';

    const netSalesShare =
      effectiveTotals.net_sales > 0 ? (item.net_sales / effectiveTotals.net_sales) * 100 : 0;

    let accentColor = theme.primary;
    if (rank === 1) accentColor = '#eab308';
    else if (rank === 2) accentColor = '#64748b';
    else if (rank === 3) accentColor = '#f97316';

    return (
      <View
        style={[styles.storeCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
      >
        {/* Left Color Accent Bar */}
        <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />

        <View style={{ flex: 1, padding: 14 }}>
          {/* Store Header Row */}
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={[
                  styles.rankIconBox,
                  { backgroundColor: rank === 1 ? '#fef08a' : rank === 2 ? '#e2e8f0' : rank === 3 ? '#ffedd5' : (isDark ? '#1e3a5f' : '#eff6ff') },
                ]}
              >
                <Text
                  style={[
                    styles.rankText,
                    { color: rank === 1 ? '#854d0e' : rank === 2 ? '#334155' : rank === 3 ? '#9a3412' : theme.primary },
                  ]}
                >
                  #{rank}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                  {branchName}
                </Text>
                <Text style={[styles.storeMetaText, { color: theme.textMuted }]}>
                  Code: {branchCode}
                </Text>
              </View>
            </View>

            <View style={[styles.achPill, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]}>
              <Text style={[styles.achPillText, { color: theme.primary }]}>
                {netSalesShare.toFixed(1)}% Share
              </Text>
            </View>
          </View>

          {/* Progress Bar Track & Fill */}
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <View style={[styles.barTrack, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, Math.max(2, netSalesShare))}%`,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* 2x2 Metrics Grid (Matches Day Wise Store Sale) */}
          <View style={[styles.metricsGrid, { backgroundColor: isDark ? '#1e293b33' : '#f8fafc', borderColor: theme.border }]}>
            <View style={styles.mCell}>
              <Text style={[styles.mLbl, { color: theme.textMuted }]}>Net Revenue</Text>
              <Text style={[styles.mVal, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {formatCurrencyNoDecimals(item.net_sales)}
              </Text>
            </View>

            <View style={styles.mCell}>
              <Text style={[styles.mLbl, { color: theme.textMuted }]}>Bills Count</Text>
              <Text style={[styles.mVal, { color: theme.textPrimary }]} numberOfLines={1}>
                {formatNumber(item.bill_count)}
              </Text>
            </View>

            <View style={styles.mCell}>
              <Text style={[styles.mLbl, { color: theme.textMuted }]}>Total Quantity</Text>
              <Text style={[styles.mVal, { color: theme.textSecondary }]} numberOfLines={1}>
                {formatNumber(item.total_qty)} Pcs
              </Text>
            </View>

            <View style={styles.mCell}>
              <Text style={[styles.mLbl, { color: theme.textMuted }]}>Avg Bill (AOV)</Text>
              <Text style={[styles.mVal, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {formatCurrencyNoDecimals(item.avg_bill_value)}
              </Text>
            </View>
          </View>

          {/* Mini Breakdown Table Box (Identical to Day Wise Store Sale) */}
          <View style={[styles.breakdownTableBox, { borderColor: theme.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Text style={[styles.thText, { color: theme.textSecondary }]}>FINANCIAL METRIC</Text>
              <Text style={[styles.thText, { color: theme.textSecondary, textAlign: 'right' }]}>AMOUNT</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.tdLabel, { color: theme.textPrimary }]}>Gross Sales</Text>
              <Text style={[styles.tdVal, { color: theme.textPrimary }]}>{formatCurrencyNoDecimals(item.sales_amount)}</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.tdLabel, { color: theme.textPrimary }]}>Taxable Amount</Text>
              <Text style={[styles.tdVal, { color: theme.textSecondary }]}>{formatCurrencyNoDecimals(item.taxable_amount)}</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.tdLabel, { color: theme.textPrimary }]}>Total Tax (GST)</Text>
              <Text style={[styles.tdVal, { color: '#0284c7' }]}>{formatCurrencyNoDecimals(item.tax)}</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tdLabel, { color: theme.textPrimary }]}>Discount Given</Text>
              <Text style={[styles.tdVal, { color: '#dc2626' }]}>{formatCurrencyNoDecimals(item.discount)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (visibleRecords.length < filteredRecords.length) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreItems} activeOpacity={0.8}>
          <ChevronDown size={16} color="#2563eb" style={{ marginRight: 6 }} />
          <Text style={styles.loadMoreBtnText}>
            Load More Stores ({filteredRecords.length - visibleRecords.length} Remaining)
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={{ height: 20 }} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Branch Sales Ranking"
        subtitle={`Store Sales Ranking (${selectedBranchCodes.join(', ') || 'All'})`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Store Sales Rankings...</Text>
        </View>
      ) : errorMessage && records.length === 0 ? (
        <View style={styles.errorBox}>
          <AlertTriangle size={32} color="#dc2626" style={{ marginBottom: 8 }} />
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Failed to Load Store Rankings</Text>
          <Text style={[styles.errorSub, { color: theme.textSecondary }]}>{errorMessage}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => loadData()}>
            <Text style={styles.retryBtnText}>Retry API Request</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleRecords}
          keyExtractor={(item, index) => `${item.branch_code || 'item'}-${index}`}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            filteredRecords.length === 0 ? (
              <View style={styles.emptyBox}>
                <Trophy size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Store Sales Records</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Adjust date range or store filters to view rankings.
                </Text>
              </View>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Unified Filter Modal */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Filter Branch Sales Rankings"
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

      {/* Standalone Branch Selector Modal */}
      <BranchSelectorModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        selectedBranchCodes={selectedBranchCodes}
        onApply={(newCodes) => {
          setSelectedBranchCodes(newCodes);
          loadData(undefined, undefined, newCodes);
        }}
        title="Select Branches to Filter"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatListContent: {
    padding: 12,
    paddingBottom: 140,
    gap: 12,
  },
  headerContainer: {
    gap: 8,
    marginBottom: 4,
  },

  // KPI Chips
  kpiWrap: { flexDirection: 'row', gap: 8 },
  kpiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 135,
  },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kLabel: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.3 },
  kValue: { fontSize: 13, fontWeight: '900', marginTop: 1 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, fontSize: 11.5, paddingVertical: 0 },

  // Store Cards
  storeCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardAccentBar: { width: 5 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '900' },
  storeNameText: { fontSize: 13, fontWeight: '800' },
  storeMetaText: { fontSize: 10, marginTop: 1 },
  achPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  achPillText: { fontSize: 10.5, fontWeight: '800' },

  barTrack: { height: 5, borderRadius: 2.5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2.5 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  mCell: { width: '50%', padding: 4 },
  mLbl: { fontSize: 8.5, fontWeight: '700' },
  mVal: { fontSize: 11, fontWeight: '800', marginTop: 1 },

  // Breakdown Table Box
  breakdownTableBox: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'space-between' },
  thText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  tdLabel: { fontSize: 10.5, fontWeight: '700' },
  tdVal: { fontSize: 11, fontWeight: '800' },

  // Load More & Empty / Error
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadMoreBtnText: { color: '#2563eb', fontSize: 12, fontWeight: '800' },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 10, fontSize: 13, fontWeight: '600' },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { fontSize: 15, fontWeight: '800' },
  errorSub: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 12 },
  retryBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptySub: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
