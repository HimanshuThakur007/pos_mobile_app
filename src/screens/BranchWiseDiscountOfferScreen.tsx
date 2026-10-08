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
import { useGlobalFilter, DatePreset } from '../context/GlobalFilterContext';
import { Badge } from '../components/Badge';
import {
  fetchBranchDiscountOffer,
  BranchDiscountOfferItem,
  BranchDiscountOfferTotals,
} from '../api/branchDiscountOfferApi';
import { fetchBranches, BranchItem } from '../api/comparisonApi';
import { formatDateToYYYYMMDD, formatCurrency, formatNumber, getStoreFilterLabel } from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Search,
  Building2,
  AlertTriangle,
  ChevronDown,
  Package,
  Percent,
  Trophy,
  Tag,
  BadgePercent,
  X,
  CalendarCheck,
  Store,
} from 'lucide-react-native';

const INITIAL_PAGE_SIZE = 30;

type SortOption = 'DISCOUNT' | 'PCT' | 'QTY' | 'SALES' | 'NAME';
type GroupTab = 'BY_STORE' | 'BREAKDOWN' | 'ALL';

export const BranchWiseDiscountOfferScreen: React.FC<{ navigation?: any }> = () => {
  const { width } = useWindowDimensions();
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
    setSelectedPreset,
    setSelectedBranchCodes,
    applyPreset,
    resetFilters,
  } = useGlobalFilter();

  const [activeTab, setActiveTab] = useState<'SHOW_ALL' | 'STORE_WISE'>('SHOW_ALL');
  const [activeGroupTab, setActiveGroupTab] = useState<GroupTab>('BY_STORE');

  // Branch Selection State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Search & Sorting State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('DISCOUNT');
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE);

  // Data state (No hardcoded default mock data)
  const [records, setRecords] = useState<BranchDiscountOfferItem[]>([]);
  const [totals, setTotals] = useState<BranchDiscountOfferTotals | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
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

      const res = await fetchBranchDiscountOffer({
        from_date: fDate,
        to_date: tDate,
        branch_code: branchCodeParam,
      });

      if (res.isLive) {
        setRecords(res.data);
        if (res.totals) setTotals(res.totals);
        setIsLiveApi(true);
        closeFilterModal();
      } else {
        setIsLiveApi(false);
        setRecords([]);
        setTotals(null);
        setErrorMessage(res.error || 'Failed to fetch store discount / offer analysis data.');
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

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Preset Date handler
  const handleApplyPreset = (preset: DatePreset) => {
    setSelectedPreset(preset);
    const now = new Date();
    let fDate = formatDateToYYYYMMDD(now);
    let tDate = formatDateToYYYYMMDD(now);

    if (preset === 'TODAY') {
      fDate = formatDateToYYYYMMDD(now);
      tDate = formatDateToYYYYMMDD(now);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      fDate = formatDateToYYYYMMDD(yest);
      tDate = formatDateToYYYYMMDD(yest);
    } else if (preset === 'LAST7') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      fDate = formatDateToYYYYMMDD(past);
      tDate = formatDateToYYYYMMDD(now);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      fDate = formatDateToYYYYMMDD(firstDay);
      tDate = formatDateToYYYYMMDD(now);
    }

    setFromDate(fDate);
    setToDate(tDate);
    loadData(fDate, tDate);
  };

  const handleApplyClick = () => {
    loadData();
  };

  const handleResetFilters = () => {
    setFromDate('2026-08-01');
    setToDate('2026-09-16');
    setSelectedPreset('THIS_MONTH');
    setSelectedBranchCodes(['5080', '5047', '5003', '5010']);
    setSearchQuery('');
    setSortBy('DISCOUNT');
    loadData('2026-08-01', '2026-09-16', ['5080', '5047', '5003', '5010']);
  };

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.branch_name || '').toLowerCase().includes(q) ||
          (r.branch_code || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'PCT') return b.discount_pct_of_sales - a.discount_pct_of_sales;
      if (sortBy === 'QTY') return b.offer_qty - a.offer_qty;
      if (sortBy === 'SALES') return b.sales_amount - a.sales_amount;
      if (sortBy === 'NAME') return a.branch_name.localeCompare(b.branch_name);
      return b.total_discount - a.total_discount;
    });

    return list;
  }, [records, searchQuery, sortBy]);

  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, displayLimit);
  }, [filteredRecords, displayLimit]);

  const getItemKey = useCallback(
    (item: BranchDiscountOfferItem, index: number) => {
      return `${activeGroupTab}-${item.branch_code || 'store'}-${index}`;
    },
    [activeGroupTab]
  );

  const loadMoreItems = () => {
    if (displayLimit < filteredRecords.length) {
      setDisplayLimit((prev) => prev + 30);
    }
  };

  // Computed Executive KPI Stats
  const kpiStats = useMemo(() => {
    if (totals) {
      return {
        totalSalesAmount: totals.total_sales_amount,
        totalDiscount: totals.total_discount,
        totalLineDiscount: totals.total_line_discount,
        totalCouponDiscount: totals.total_coupon_discount,
        totalSchemeValue: totals.total_scheme_value,
        totalOfferQty: totals.total_offer_qty,
        totalBillCount: totals.total_bill_count,
        totalStores: totals.total_stores,
        overallDiscountPct: totals.overall_discount_pct,
        topDiscountStore: totals.top_discount_store,
        topDiscountAmount: totals.top_discount_amount,
      };
    }

    let sales = 0;
    let disc = 0;
    let lineDisc = 0;
    let couponDisc = 0;
    let schemeVal = 0;
    let offerQty = 0;
    let bills = 0;

    let topStore = 'None';
    let topAmt = 0;

    records.forEach((r) => {
      sales += r.sales_amount;
      disc += r.total_discount;
      lineDisc += r.line_discount;
      couponDisc += r.coupon_discount;
      schemeVal += r.scheme_value;
      offerQty += r.offer_qty;
      bills += r.bill_count;

      if (r.total_discount > topAmt) {
        topAmt = r.total_discount;
        topStore = r.branch_name;
      }
    });

    const overallPct = sales > 0 ? (disc / sales) * 100 : 0;

    return {
      totalSalesAmount: sales,
      totalDiscount: disc,
      totalLineDiscount: lineDisc,
      totalCouponDiscount: couponDisc,
      totalSchemeValue: schemeVal,
      totalOfferQty: offerQty,
      totalBillCount: bills,
      totalStores: records.length,
      overallDiscountPct: Number(overallPct.toFixed(2)),
      topDiscountStore: topStore,
      topDiscountAmount: topAmt,
    };
  }, [records, totals]);

  // Header Component for FlatList
  const renderHeader = () => {
    return (
      <View style={styles.listHeaderContainer}>
        {/* Top Action Filter Bar */}
        <UnifiedTopFilterBar
          fromDate={fromDate}
          toDate={toDate}
          extraPills={[
            { icon: Building2, label: getStoreFilterLabel(selectedBranchCodes, branches) },
            { icon: BadgePercent, label: 'Discount & Offers' },
          ]}
          onToggleFilters={openFilterModal}
          onRefreshData={() => loadData()}
        />

        {/* Error Warning Banner if offline/failed */}
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: isDark ? '#3f1d1d' : '#fef2f2', borderColor: '#fca5a5' }]}>
            <AlertTriangle size={16} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={[styles.errorBannerText, { color: isDark ? '#fca5a5' : '#991b1b' }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Two Tab Switcher: "Show All" vs "Store Wise" (Matches Day Wise Store Sale) */}
        <View style={[styles.tabBarContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'SHOW_ALL' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
            ]}
            onPress={() => setActiveTab('SHOW_ALL')}
            activeOpacity={0.8}
          >
            <CalendarCheck size={13} color={activeTab === 'SHOW_ALL' ? theme.primary : theme.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'SHOW_ALL' ? theme.textPrimary : theme.textMuted }]}>
              Show All (Matrix)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'STORE_WISE' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
            ]}
            onPress={() => setActiveTab('STORE_WISE')}
            activeOpacity={0.8}
          >
            <Store size={13} color={activeTab === 'STORE_WISE' ? theme.primary : theme.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'STORE_WISE' ? theme.textPrimary : theme.textMuted }]}>
              Store Wise Matrix ({filteredRecords.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clean Compact Executive KPI Strip (Horizontal Scrollable for Mobile) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiStripScroll}
        >
          {/* Card 1: Total Discount Granted */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Percent size={11} color="#9333ea" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>TOTAL DISCOUNT</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#c084fc' : '#7e22ce' }]} numberOfLines={1}>
              {formatCurrency(kpiStats.totalDiscount)}
            </Text>
          </View>

          {/* Card 2: Highest Discount Store */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Trophy size={11} color="#ca8a04" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>TOP STORE</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#fde047' : '#a16207' }]} numberOfLines={1}>
              {kpiStats.topDiscountStore}
            </Text>
          </View>

          {/* Card 3: Total Offer Units Sold */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Package size={11} color="#10b981" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>OFFER UNITS</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#34d399' : '#059669' }]} numberOfLines={1}>
              {formatNumber(kpiStats.totalOfferQty)} Pcs
            </Text>
          </View>

          {/* Card 4: Line Item Discount */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Tag size={11} color={theme.primary} />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>LINE DISCOUNT</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatCurrency(kpiStats.totalLineDiscount)}
            </Text>
          </View>
        </ScrollView>

        {/* Compact Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Search size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search store name or branch code..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={13} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Render consolidated breakdown table if SHOW_ALL tab is active */}
        {activeTab === 'SHOW_ALL' && renderConsolidatedTable()}
      </View>
    );
  };

  // Consolidated Breakdown Table (Tab 1: SHOW_ALL)
  const renderConsolidatedTable = () => (
    <View style={[styles.breakdownTableBox, { borderColor: theme.border }]}>
      <View style={[styles.tableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <Text style={[styles.thText, { color: theme.textSecondary, width: '40%' }]}>STORE</Text>
        <Text style={[styles.thText, { color: theme.textSecondary, width: '30%', textAlign: 'right' }]}>DISCOUNT</Text>
        <Text style={[styles.thText, { color: theme.textSecondary, width: '30%', textAlign: 'right' }]}>RATIO / QTY</Text>
      </View>

      {filteredRecords.map((item, idx) => (
        <View key={`${item.branch_code}-${idx}`} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
          <View style={{ width: '40%' }}>
            <Text style={[styles.tdLabel, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.branch_name}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textSecondary }}>Code: {item.branch_code}</Text>
          </View>

          <View style={{ width: '30%', alignItems: 'flex-end' }}>
            <Text style={[styles.tdVal, { color: '#9333ea' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(item.total_discount)}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textSecondary }}>Line: {formatCurrency(item.line_discount)}</Text>
          </View>

          <View style={{ width: '30%', alignItems: 'flex-end' }}>
            <Text style={[styles.tdVal, { color: theme.primary }]} numberOfLines={1}>
              {item.discount_pct_of_sales.toFixed(1)}%
            </Text>
            <Text style={{ fontSize: 9, fontWeight: '600', color: '#10b981' }}>{item.offer_qty} Pcs</Text>
          </View>
        </View>
      ))}
    </View>
  );

  // Direct Card Item Renderer (Standard Day Wise Store Sale Card Layout)
  const renderGroupItem = ({ item, index }: { item: BranchDiscountOfferItem; index: number }) => {
    const maxDiscount = Math.max(...records.map((r) => r.total_discount), 1);
    const barPct = maxDiscount > 0 ? Math.min(100, Math.max(5, (item.total_discount / maxDiscount) * 100)) : 0;
    const isTopItem = index === 0;

    return (
      <View
        key={`${item.branch_code}-${index}`}
        style={[
          styles.recordCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isTopItem && { borderColor: '#ca8a04', borderWidth: 1.5 },
        ]}
      >
        {/* Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.rankIconBox, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
              <Text style={[styles.rankText, { color: isTopItem ? '#ca8a04' : theme.primary }]}>#{index + 1}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.branch_name || `Store #${item.branch_code}`}
              </Text>
              <Text style={[styles.storeMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                Code: {item.branch_code} • Gross: {formatCurrency(item.sales_amount)} ({item.bill_count} Bills)
              </Text>
            </View>
          </View>

          <View style={[styles.achPill, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]}>
            <Text style={[styles.achPillText, { color: '#9333ea' }]}>
              {item.discount_pct_of_sales.toFixed(1)}% Ratio
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
                  width: `${barPct}%`,
                  backgroundColor: isTopItem ? '#eab308' : '#9333ea',
                },
              ]}
            />
          </View>
        </View>

        {/* 2x2 Metrics Grid */}
        <View style={[styles.metricsGrid, { backgroundColor: isDark ? '#1e293b33' : '#f8fafc', borderColor: theme.border }]}>
          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textSecondary }]}>TOTAL DISCOUNT</Text>
            <Text style={[styles.mVal, { color: '#9333ea' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(item.total_discount)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textSecondary }]}>LINE DISCOUNT</Text>
            <Text style={[styles.mVal, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(item.line_discount)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textSecondary }]}>COUPON DISC</Text>
            <Text style={[styles.mVal, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(item.coupon_discount)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textSecondary }]}>OFFER QTY / SCHEME</Text>
            <Text style={[styles.mVal, { color: '#10b981' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatNumber(item.offer_qty)} Pcs ({formatCurrency(item.scheme_value)})
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Footer Component for Load More
  const renderFooter = () => {
    if (visibleRecords.length < filteredRecords.length) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreItems} activeOpacity={0.8}>
          <ChevronDown size={18} color="#2563eb" style={{ marginRight: 6 }} />
          <Text style={styles.loadMoreBtnText}>
            Load More Stores ({filteredRecords.length - visibleRecords.length} Remaining)
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Discount & Offer Analysis"
        subtitle={`Live API • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {isLoading && records.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Fetching store discount & offer analysis...
          </Text>
        </View>
      ) : (
        <FlatList<any>
          data={activeTab === 'SHOW_ALL' ? [] : visibleRecords}
          keyExtractor={getItemKey}
          renderItem={renderGroupItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={activeTab === 'STORE_WISE' ? renderFooter : null}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Package size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Discount & Offer Records Found</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Please select date range or choose different branch codes in the filter.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={25}
          maxToRenderPerBatch={30}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* UNIFIED FILTER MODAL — Rendered at Root level outside FlatList */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Discount & Offer Analysis Filters"
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

      {/* BRANCH SELECTOR MODAL — Rendered at Root level outside FlatList */}
      <BranchSelectorModal
        visible={isBranchModalOpen}
        branches={branches}
        selectedBranchCodes={selectedBranchCodes}
        onClose={() => setIsBranchModalOpen(false)}
        onApply={(newBranchCodes: string[]) => {
          setSelectedBranchCodes(newBranchCodes);
          setIsBranchModalOpen(false);
          loadData(undefined, undefined, newBranchCodes);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  listHeaderContainer: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorBannerText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  kpiStripScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  kpiStripCard: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 120,
    justifyContent: 'center',
  },
  kpiStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiStripLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  kpiStripVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    paddingVertical: 0,
  },
  recordCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 10,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '900' },
  storeNameText: { fontSize: 13, fontWeight: '800' },
  storeMetaText: { fontSize: 10.5, fontWeight: '700', marginTop: 1 },
  achPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  achPillText: { fontSize: 10.5, fontWeight: '800' },

  barTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderRadius: 10, borderWidth: 1 },
  mCell: { width: '50%', padding: 4 },
  mLbl: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4 },
  mVal: { fontSize: 11.5, fontWeight: '800', marginTop: 1.5 },
  breakdownGrid: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  breakdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  breakdownCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  breakdownVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
  },
  breakdownText: {
    fontSize: 11,
  },
  breakdownBold: {
    fontWeight: '700',
  },
  aovText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreBtnText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBarContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    marginVertical: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTabItem: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownTableBox: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tdLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  tdVal: {
    fontSize: 12,
    fontWeight: '800',
  },
});
