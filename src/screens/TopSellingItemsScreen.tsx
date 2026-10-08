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
import { TopSellingItemsVisualChart } from '../components/widgets/TopSellingItemsVisualChart';
import {
  fetchTopSellingItems,
  TopSellingItem,
  TopSellingItemsTotals,
} from '../api/topSellingItemsApi';
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
  BarChart3,
  LayoutList,
  Trophy,
  ShoppingBag,
  Tag,
  Flame,
} from 'lucide-react-native';

const INITIAL_PAGE_SIZE = 30;

type SortOption = 'SALES' | 'QTY' | 'NAME' | 'RANK';
type ViewMode = 'LIST' | 'CHARTS';
type GroupTab = 'BY_ITEM' | 'BY_STORE' | 'ALL';

export const TopSellingItemsScreen: React.FC<{ navigation?: any }> = () => {
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

  // Default View Mode: 'LIST'
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [activeGroupTab, setActiveGroupTab] = useState<GroupTab>('BY_ITEM');

  // Branch Selection State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Search & Sorting State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('SALES');
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE);

  // Data state (No hardcoded default mock data)
  const [records, setRecords] = useState<TopSellingItem[]>([]);
  const [totals, setTotals] = useState<TopSellingItemsTotals | null>(null);
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

      const res = await fetchTopSellingItems({
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
        setErrorMessage(res.error || 'Failed to fetch top selling items data.');
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
    setSortBy('SALES');
    loadData('2026-08-01', '2026-09-16', ['5080', '5047', '5003', '5010']);
  };

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.item_name || '').toLowerCase().includes(q) ||
          (r.item_code || '').toLowerCase().includes(q) ||
          (r.branch_name || '').toLowerCase().includes(q) ||
          (r.branch_code || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'QTY') return b.total_qty - a.total_qty;
      if (sortBy === 'NAME') return a.item_name.localeCompare(b.item_name);
      if (sortBy === 'RANK') return a.rank - b.rank;
      return b.sales_amount - a.sales_amount;
    });

    return list;
  }, [records, searchQuery, sortBy]);

  // Grouped by Item across stores
  const groupedByItem = useMemo(() => {
    const map: Record<
      string,
      {
        item_code: string;
        item_name: string;
        total_qty: number;
        sales_amount: number;
        storeSet: Set<string>;
        minRank: number;
      }
    > = {};

    filteredRecords.forEach((r) => {
      const key = r.item_code || r.item_name || 'UNKNOWN';
      if (!map[key]) {
        map[key] = {
          item_code: key,
          item_name: r.item_name || r.item_code,
          total_qty: 0,
          sales_amount: 0,
          storeSet: new Set(),
          minRank: r.rank || 99,
        };
      }
      map[key].total_qty += r.total_qty;
      map[key].sales_amount += r.sales_amount;
      if (r.rank && r.rank < map[key].minRank) map[key].minRank = r.rank;
      if (r.branch_code) map[key].storeSet.add(r.branch_code);
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        store_count: item.storeSet.size,
      }))
      .sort((a, b) => b.sales_amount - a.sales_amount);
  }, [filteredRecords]);

  // Grouped by Store
  const groupedByStore = useMemo(() => {
    const map: Record<
      string,
      {
        branch_code: string;
        branch_name: string;
        total_qty: number;
        sales_amount: number;
        itemSet: Set<string>;
        topItem: string;
        topItemAmount: number;
      }
    > = {};

    filteredRecords.forEach((r) => {
      const key = r.branch_code || 'UNKNOWN';
      if (!map[key]) {
        map[key] = {
          branch_code: key,
          branch_name: r.branch_name || `Store ${key}`,
          total_qty: 0,
          sales_amount: 0,
          itemSet: new Set(),
          topItem: r.item_name || r.item_code,
          topItemAmount: r.sales_amount,
        };
      }
      map[key].total_qty += r.total_qty;
      map[key].sales_amount += r.sales_amount;
      if (r.item_name) map[key].itemSet.add(r.item_name);

      if (r.sales_amount > map[key].topItemAmount) {
        map[key].topItemAmount = r.sales_amount;
        map[key].topItem = r.item_name || r.item_code;
      }
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        item_count: item.itemSet.size,
      }))
      .sort((a, b) => b.sales_amount - a.sales_amount);
  }, [filteredRecords]);

  // Active Display Dataset
  const activeDataset = useMemo(() => {
    if (activeGroupTab === 'BY_ITEM') return groupedByItem;
    if (activeGroupTab === 'BY_STORE') return groupedByStore;
    return filteredRecords;
  }, [activeGroupTab, groupedByItem, groupedByStore, filteredRecords]);

  const visibleRecords = useMemo(() => {
    return activeDataset.slice(0, displayLimit);
  }, [activeDataset, displayLimit]);

  const getItemKey = useCallback(
    (item: any, index: number) => {
      const baseKey =
        item.item_code ||
        item.item_name ||
        item.branch_code ||
        `item-${index}`;
      return `${activeGroupTab}-${baseKey}-${index}`;
    },
    [activeGroupTab]
  );

  const loadMoreItems = () => {
    if (displayLimit < activeDataset.length) {
      setDisplayLimit((prev) => prev + 30);
    }
  };

  // Computed Executive KPI Stats
  const kpiStats = useMemo(() => {
    if (totals) {
      return {
        totalSalesAmount: totals.total_sales_amount,
        totalQty: totals.total_qty,
        totalItems: totals.total_items,
        totalStores: totals.total_stores,
        topItemName: totals.top_item_name,
        topItemAmount: totals.top_item_amount,
      };
    }

    let sales = 0;
    let qty = 0;
    const storeSet = new Set<string>();
    const itemMap: Record<string, { name: string; amount: number }> = {};

    records.forEach((r) => {
      sales += r.sales_amount;
      qty += r.total_qty;
      if (r.branch_code) storeSet.add(r.branch_code);

      const code = r.item_code || r.item_name;
      if (!itemMap[code]) {
        itemMap[code] = { name: r.item_name || r.item_code, amount: 0 };
      }
      itemMap[code].amount += r.sales_amount;
    });

    let topItem = 'None';
    let topItemAmt = 0;
    Object.values(itemMap).forEach((val) => {
      if (val.amount > topItemAmt) {
        topItemAmt = val.amount;
        topItem = val.name;
      }
    });

    return {
      totalSalesAmount: sales,
      totalQty: qty,
      totalItems: Object.keys(itemMap).length,
      totalStores: storeSet.size,
      topItemName: topItem,
      topItemAmount: topItemAmt,
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
            { icon: Flame, label: 'Top 10 Selling' },
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

        {/* Executive KPI Cards Header */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Sales Revenue */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]} numberOfLines={1}>TOP 10 SALES REVENUE</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#1e3a8a33' : '#dbeafe' }]}>
                <TrendingUp size={16} color={theme.primary} />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: theme.textPrimary }]}>{formatCurrency(kpiStats.totalSalesAmount)}</Text>
            <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
              Combined top items revenue ({selectedBranchCodes.length} stores)
            </Text>
          </View>

          {/* Card 2: #1 Top Selling Item */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]} numberOfLines={1}>#1 SELLING ITEM</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#3f2c00' : '#fef9c3' }]}>
                <Trophy size={16} color="#ca8a04" />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: isDark ? '#fde047' : '#a16207' }]} numberOfLines={1}>
              {kpiStats.topItemName}
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
              Revenue: {formatCurrency(kpiStats.topItemAmount)}
            </Text>
          </View>

          {/* Card 3: Total Units Sold */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]} numberOfLines={1}>UNITS SOLD</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#064e3b33' : '#d1fae5' }]}>
                <Package size={16} color="#10b981" />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: isDark ? '#34d399' : '#059669' }]}>
              {formatNumber(kpiStats.totalQty)} Pcs
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
              Across {kpiStats.totalItems} top item products
            </Text>
          </View>

          {/* Card 4: Store Coverage */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]} numberOfLines={1}>UNIQUE ITEMS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#581c8733' : '#f3e8ff' }]}>
                <ShoppingBag size={16} color="#9333ea" />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: isDark ? '#c084fc' : '#7e22ce' }]}>
              {kpiStats.totalItems} Items
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
              In {kpiStats.totalStores} active store locations
            </Text>
          </View>
        </View>

        {/* View Mode Switcher Header Bar (List vs Graphical Chart) */}
        <View style={styles.viewModeHeaderRow}>
          <View style={styles.modeTabsRow}>
            <TouchableOpacity
              style={[
                styles.modeTabBtn,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                viewMode === 'LIST' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setViewMode('LIST')}
              activeOpacity={0.8}
            >
              <LayoutList size={13} color={viewMode === 'LIST' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 5 }} />
              <Text style={[styles.modeTabText, { color: viewMode === 'LIST' ? '#ffffff' : theme.textSecondary }]}>
                Item List
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeTabBtn,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                viewMode === 'CHARTS' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setViewMode('CHARTS')}
              activeOpacity={0.8}
            >
              <BarChart3 size={13} color={viewMode === 'CHARTS' ? '#ffffff' : theme.textSecondary} style={{ marginRight: 5 }} />
              <Text style={[styles.modeTabText, { color: viewMode === 'CHARTS' ? '#ffffff' : theme.textSecondary }]}>
                Graphical Charts
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CHARTS VIEW MODE */}
        {viewMode === 'CHARTS' ? (
          <TopSellingItemsVisualChart records={records} totals={kpiStats as any} />
        ) : (
          /* Search Input Bar */
          <View style={[styles.searchRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Search size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search item code, name, store..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>
    );
  };

  // Direct Item Renderer
  const renderGroupItem = ({ item, index }: { item: TopSellingItem; index: number }) => (
    <View style={[styles.recordCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.rankBadge, { backgroundColor: item.rank === 1 ? '#fef9c3' : theme.subtleBoxBg }]}>
              <Text style={[styles.rankText, { color: item.rank === 1 ? '#ca8a04' : theme.primary }]}>
                #{item.rank || index + 1}
              </Text>
            </View>
            <Text style={[styles.branchNameText, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.item_name}
            </Text>
          </View>

          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary }} numberOfLines={1}>
            🏬 {item.branch_name}
          </Text>

          <Text style={[styles.dateText, { color: theme.textSecondary }]} numberOfLines={1}>
            Item Code: {item.item_code}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.netSalesText, { color: theme.primary }]}>
            {formatCurrency(item.sales_amount)}
          </Text>
          <Text style={[styles.billCountText, { color: theme.textMuted }]}>
            {formatNumber(item.total_qty)} Pcs
          </Text>
        </View>
      </View>

      <View style={[styles.cardFooterRow, { borderTopColor: theme.divider }]}>
        <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
          Rank: <Text style={[styles.breakdownBold, { color: theme.textPrimary }]}>#{item.rank || index + 1}</Text>
        </Text>
        <Text style={[styles.aovText, { color: theme.textSecondary }]}>
          Avg Price: {formatCurrency(item.total_qty > 0 ? item.sales_amount / item.total_qty : 0)}
        </Text>
      </View>
    </View>
  );

  // Footer Component for Load More
  const renderFooter = () => {
    if (viewMode === 'LIST' && visibleRecords.length < activeDataset.length) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreItems} activeOpacity={0.8}>
          <ChevronDown size={18} color="#2563eb" style={{ marginRight: 6 }} />
          <Text style={styles.loadMoreBtnText}>
            Load More Records ({activeDataset.length - visibleRecords.length} Remaining)
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Top 10 Selling Items"
        subtitle={`Live API • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {isLoading && records.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Fetching top 10 selling items...
          </Text>
        </View>
      ) : (
        <FlatList<any>
          data={viewMode === 'CHARTS' ? [] : visibleRecords}
          keyExtractor={getItemKey}
          renderItem={renderGroupItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            viewMode === 'LIST' ? (
              <View style={styles.emptyBox}>
                <Package size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Top Selling Items Found</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Please select date range or choose different branch codes in the filter.
                </Text>
              </View>
            ) : null
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
      {/* Note: limit and order_by options are hardcoded internally as requested */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Top Selling Items Filters"
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
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  kpiLabel: {
    flex: 1,
    marginRight: 4,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiIconBox: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
  },
  viewModeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupTabRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  groupSubTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  groupSubTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  recordCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
  },
  branchNameText: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    marginTop: 2,
  },
  netSalesText: {
    fontSize: 14,
    fontWeight: '800',
  },
  billCountText: {
    fontSize: 11,
    marginTop: 1,
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
});
