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
  Modal,
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
  fetchBranchSubCategorySales,
  BranchSubCategorySalesItem,
  BranchSubCategorySalesTotals,
} from '../api/branchSubCategorySalesApi';
import { fetchBranches, BranchItem } from '../api/comparisonApi';
import { formatDateToYYYYMMDD, formatCurrency, formatNumber, getStoreFilterLabel } from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BranchSubCategorySalesVisualChart } from '../components/widgets/BranchSubCategorySalesVisualChart';
import {
  TrendingUp,
  Search,
  Building2,
  AlertTriangle,
  ChevronDown,
  Package,
  Percent,
  Trophy,
  Layers,
  FolderTree,
  Tag,
  List,
  BarChart3,
  X,
  ChevronRight,
  Store,
} from 'lucide-react-native';

const INITIAL_PAGE_SIZE = 30;

type ViewMode = 'GROUPED' | 'LIST' | 'CHART';
type GroupTab = 'BY_SUBCAT' | 'BY_CAT' | 'BY_DEPT' | 'BY_STORE';

export const BranchWiseSubCategorySalesScreen: React.FC<{ navigation?: any }> = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

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

  // Streamlined State
  const [viewMode, setViewMode] = useState<ViewMode>('GROUPED');
  const [activeGroupTab, setActiveGroupTab] = useState<GroupTab>('BY_SUBCAT');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE);

  // Branch Selection State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Detail Modal State
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Data state
  const [records, setRecords] = useState<BranchSubCategorySalesItem[]>([]);
  const [totals, setTotals] = useState<BranchSubCategorySalesTotals | null>(null);
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

      const res = await fetchBranchSubCategorySales({
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
        setErrorMessage(res.error || 'Failed to fetch store sub-category sales data.');
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

  // Available unique categories for category filter pills
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.category) set.add(r.category.toUpperCase());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [records]);

  // Filtered Raw Records (Sorted by sales_amount descending)
  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter((r) => r.category.toUpperCase() === selectedCategoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.sub_category.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.branch_name.toLowerCase().includes(q) ||
          r.branch_code.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => b.sales_amount - a.sales_amount);

    return list;
  }, [records, selectedCategoryFilter, searchQuery]);

  // Grouped Aggregation Datasets
  const groupedData = useMemo(() => {
    if (activeGroupTab === 'BY_SUBCAT') {
      const map: Record<
        string,
        {
          key: string;
          title: string;
          subtitle: string;
          category: string;
          department: string;
          total_qty: number;
          sales_amount: number;
          discount: number;
          storeSet: Set<string>;
          storeMap: Record<string, { branch_code: string; branch_name: string; sales_amount: number; total_qty: number }>;
        }
      > = {};

      filteredRecords.forEach((r) => {
        const k = r.sub_category || 'GENERAL';
        if (!map[k]) {
          map[k] = {
            key: k,
            title: k,
            subtitle: `${r.category} • ${r.department}`,
            category: r.category,
            department: r.department,
            total_qty: 0,
            sales_amount: 0,
            discount: 0,
            storeSet: new Set(),
            storeMap: {},
          };
        }
        map[k].total_qty += r.total_qty;
        map[k].sales_amount += r.sales_amount;
        map[k].discount += r.discount;
        map[k].storeSet.add(r.branch_code);

        const bCode = r.branch_code || 'UNKNOWN';
        if (!map[k].storeMap[bCode]) {
          map[k].storeMap[bCode] = {
            branch_code: bCode,
            branch_name: r.branch_name || bCode,
            sales_amount: 0,
            total_qty: 0,
          };
        }
        map[k].storeMap[bCode].sales_amount += r.sales_amount;
        map[k].storeMap[bCode].total_qty += r.total_qty;
      });

      return Object.values(map)
        .map((item) => ({
          ...item,
          store_count: item.storeSet.size,
          asp: item.total_qty > 0 ? item.sales_amount / item.total_qty : 0,
          stores: Object.values(item.storeMap).sort((a, b) => b.sales_amount - a.sales_amount),
        }))
        .sort((a, b) => b.sales_amount - a.sales_amount);
    }

    if (activeGroupTab === 'BY_CAT') {
      const map: Record<
        string,
        {
          key: string;
          title: string;
          subtitle: string;
          department: string;
          total_qty: number;
          sales_amount: number;
          discount: number;
          subCatSet: Set<string>;
          storeSet: Set<string>;
          storeMap: Record<string, { branch_code: string; branch_name: string; sales_amount: number; total_qty: number }>;
        }
      > = {};

      filteredRecords.forEach((r) => {
        const k = r.category || 'GENERAL';
        if (!map[k]) {
          map[k] = {
            key: k,
            title: k,
            subtitle: `Department: ${r.department}`,
            department: r.department,
            total_qty: 0,
            sales_amount: 0,
            discount: 0,
            subCatSet: new Set(),
            storeSet: new Set(),
            storeMap: {},
          };
        }
        map[k].total_qty += r.total_qty;
        map[k].sales_amount += r.sales_amount;
        map[k].discount += r.discount;
        map[k].subCatSet.add(r.sub_category);
        map[k].storeSet.add(r.branch_code);

        const bCode = r.branch_code || 'UNKNOWN';
        if (!map[k].storeMap[bCode]) {
          map[k].storeMap[bCode] = {
            branch_code: bCode,
            branch_name: r.branch_name || bCode,
            sales_amount: 0,
            total_qty: 0,
          };
        }
        map[k].storeMap[bCode].sales_amount += r.sales_amount;
        map[k].storeMap[bCode].total_qty += r.total_qty;
      });

      return Object.values(map)
        .map((item) => ({
          ...item,
          subcat_count: item.subCatSet.size,
          store_count: item.storeSet.size,
          asp: item.total_qty > 0 ? item.sales_amount / item.total_qty : 0,
          stores: Object.values(item.storeMap).sort((a, b) => b.sales_amount - a.sales_amount),
        }))
        .sort((a, b) => b.sales_amount - a.sales_amount);
    }

    if (activeGroupTab === 'BY_DEPT') {
      const map: Record<
        string,
        {
          key: string;
          title: string;
          subtitle: string;
          total_qty: number;
          sales_amount: number;
          discount: number;
          catSet: Set<string>;
          subCatSet: Set<string>;
          storeSet: Set<string>;
        }
      > = {};

      filteredRecords.forEach((r) => {
        const k = r.department || 'GENERAL';
        if (!map[k]) {
          map[k] = {
            key: k,
            title: k,
            subtitle: `Department Overview`,
            total_qty: 0,
            sales_amount: 0,
            discount: 0,
            catSet: new Set(),
            subCatSet: new Set(),
            storeSet: new Set(),
          };
        }
        map[k].total_qty += r.total_qty;
        map[k].sales_amount += r.sales_amount;
        map[k].discount += r.discount;
        map[k].catSet.add(r.category);
        map[k].subCatSet.add(r.sub_category);
        map[k].storeSet.add(r.branch_code);
      });

      return Object.values(map)
        .map((item) => ({
          ...item,
          cat_count: item.catSet.size,
          subcat_count: item.subCatSet.size,
          store_count: item.storeSet.size,
          asp: item.total_qty > 0 ? item.sales_amount / item.total_qty : 0,
        }))
        .sort((a, b) => b.sales_amount - a.sales_amount);
    }

    // BY_STORE
    const map: Record<
      string,
      {
        key: string;
        title: string;
        subtitle: string;
        branch_code: string;
        total_qty: number;
        sales_amount: number;
        discount: number;
        subCatSet: Set<string>;
      }
    > = {};

    filteredRecords.forEach((r) => {
      const k = r.branch_code || 'UNKNOWN';
      if (!map[k]) {
        map[k] = {
          key: k,
          title: r.branch_name || `Store ${k}`,
          subtitle: `Store Code: ${k}`,
          branch_code: k,
          total_qty: 0,
          sales_amount: 0,
          discount: 0,
          subCatSet: new Set(),
        };
      }
      map[k].total_qty += r.total_qty;
      map[k].sales_amount += r.sales_amount;
      map[k].discount += r.discount;
      map[k].subCatSet.add(r.sub_category);
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        subcat_count: item.subCatSet.size,
        asp: item.total_qty > 0 ? item.sales_amount / item.total_qty : 0,
      }))
      .sort((a, b) => b.sales_amount - a.sales_amount);
  }, [filteredRecords, activeGroupTab]);

  const visibleGroupedRecords = useMemo(() => {
    return groupedData.slice(0, displayLimit);
  }, [groupedData, displayLimit]);

  const visibleListRecords = useMemo(() => {
    return filteredRecords.slice(0, displayLimit);
  }, [filteredRecords, displayLimit]);

  // Computed Executive KPI Stats
  const kpiStats = useMemo(() => {
    if (totals) {
      const discRatio = totals.total_sales_amount > 0 ? (totals.total_discount / totals.total_sales_amount) * 100 : 0;
      return {
        totalSalesAmount: totals.total_sales_amount,
        totalQty: totals.total_qty,
        totalDiscount: totals.total_discount,
        discountRatio: discRatio,
        totalRecords: totals.total_records,
        totalSubCategories: totals.total_sub_categories,
        totalCategories: totals.total_categories,
        topCategory: totals.top_category || 'None',
        topCategoryAmount: totals.top_category_amount || 0,
        topSubCategory: totals.top_sub_category || 'None',
        topSubCategoryAmount: totals.top_sub_category_amount || 0,
      };
    }

    let sales = 0;
    let qty = 0;
    let disc = 0;
    const catMap: Record<string, number> = {};
    const subCatMap: Record<string, number> = {};

    records.forEach((r) => {
      sales += r.sales_amount;
      qty += r.total_qty;
      disc += r.discount;

      if (r.category) catMap[r.category] = (catMap[r.category] || 0) + r.sales_amount;
      if (r.sub_category) subCatMap[r.sub_category] = (subCatMap[r.sub_category] || 0) + r.sales_amount;
    });

    let topCat = 'None';
    let topCatAmt = 0;
    Object.entries(catMap).forEach(([c, a]) => {
      if (a > topCatAmt) {
        topCatAmt = a;
        topCat = c;
      }
    });

    let topSubCat = 'None';
    let topSubCatAmt = 0;
    Object.entries(subCatMap).forEach(([sc, a]) => {
      if (a > topSubCatAmt) {
        topSubCatAmt = a;
        topSubCat = sc;
      }
    });

    const discRatio = sales > 0 ? (disc / sales) * 100 : 0;

    return {
      totalSalesAmount: sales,
      totalQty: qty,
      totalDiscount: disc,
      discountRatio: discRatio,
      totalRecords: records.length,
      totalSubCategories: Object.keys(subCatMap).length,
      totalCategories: Object.keys(catMap).length,
      topCategory: topCat,
      topCategoryAmount: topCatAmt,
      topSubCategory: topSubCat,
      topSubCategoryAmount: topSubCatAmt,
    };
  }, [records, totals]);

  const maxGroupSalesAmount = useMemo(() => {
    if (groupedData.length === 0) return 1;
    return Math.max(...groupedData.map((g) => g.sales_amount), 1);
  }, [groupedData]);

  const maxListSalesAmount = useMemo(() => {
    if (filteredRecords.length === 0) return 1;
    return Math.max(...filteredRecords.map((r) => r.sales_amount), 1);
  }, [filteredRecords]);

  const handleOpenDetailModal = (item: any) => {
    setSelectedDetailItem(item);
    setIsDetailModalOpen(true);
  };

  // Header Component for FlatList
  const renderHeader = () => {
    return (
      <View style={styles.listHeaderContainer}>
        {/* Unified Top Filter Bar */}
        <UnifiedTopFilterBar
          fromDate={fromDate}
          toDate={toDate}
          extraPills={[
            { icon: Building2, label: getStoreFilterLabel(selectedBranchCodes, branches) },
          ]}
          onToggleFilters={openFilterModal}
          onRefreshData={() => loadData()}
        />

        {/* Error Warning Banner */}
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: isDark ? '#3f1d1d' : '#fef2f2', borderColor: '#fca5a5' }]}>
            <AlertTriangle size={16} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={[styles.errorBannerText, { color: isDark ? '#fca5a5' : '#991b1b' }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Clean Compact Executive KPI Strip (Horizontal Scrollable for Mobile) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiStripScroll}
        >
          {/* Card 1: Total Revenue */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <TrendingUp size={11} color={theme.primary} />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>REVENUE</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatCurrency(kpiStats.totalSalesAmount)}
            </Text>
          </View>

          {/* Card 2: Top Sub-Category */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Trophy size={11} color="#ca8a04" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>TOP SUB-CAT</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#fde047' : '#a16207' }]} numberOfLines={1}>
              {kpiStats.topSubCategory}
            </Text>
          </View>

          {/* Card 3: Total Units Sold */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Package size={11} color="#10b981" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>UNITS SOLD</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#34d399' : '#059669' }]} numberOfLines={1}>
              {formatNumber(kpiStats.totalQty)} Pcs
            </Text>
          </View>

          {/* Card 4: Total Discount */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Percent size={11} color="#9333ea" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>DISCOUNT</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#c084fc' : '#7e22ce' }]} numberOfLines={1}>
              {formatCurrency(kpiStats.totalDiscount)} ({kpiStats.discountRatio.toFixed(1)}%)
            </Text>
          </View>
        </ScrollView>

        {/* SINGLE Streamlined View Switcher Bar */}
        <View style={[styles.singleViewModeBar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.singleTabBtn,
              viewMode === 'GROUPED' && [styles.activeSingleTabBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }],
            ]}
            onPress={() => setViewMode('GROUPED')}
          >
            <FolderTree size={13} color={viewMode === 'GROUPED' ? theme.primary : theme.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.singleTabText, { color: viewMode === 'GROUPED' ? theme.primary : theme.textMuted }]}>
              Grouped
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.singleTabBtn,
              viewMode === 'LIST' && [styles.activeSingleTabBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }],
            ]}
            onPress={() => setViewMode('LIST')}
          >
            <List size={13} color={viewMode === 'LIST' ? theme.primary : theme.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.singleTabText, { color: viewMode === 'LIST' ? theme.primary : theme.textMuted }]}>
              Store Entries
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.singleTabBtn,
              viewMode === 'CHART' && [styles.activeSingleTabBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }],
            ]}
            onPress={() => setViewMode('CHART')}
          >
            <BarChart3 size={13} color={viewMode === 'CHART' ? theme.primary : theme.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.singleTabText, { color: viewMode === 'CHART' ? theme.primary : theme.textMuted }]}>
              Chart
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Level Pills (Inline Pills when in GROUPED mode) */}
        {viewMode === 'GROUPED' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupChipsScroll}>
            {(
              [
                { id: 'BY_SUBCAT', label: 'By Sub-Category' },
                { id: 'BY_CAT', label: 'By Category' },
                { id: 'BY_DEPT', label: 'By Department' },
                { id: 'BY_STORE', label: 'By Store' },
              ] as { id: GroupTab; label: string }[]
            ).map((gt) => {
              const isSel = activeGroupTab === gt.id;
              return (
                <TouchableOpacity
                  key={gt.id}
                  style={[
                    styles.groupPillChip,
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                    isSel && { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', borderColor: theme.primary },
                  ]}
                  onPress={() => setActiveGroupTab(gt.id)}
                >
                  <Text style={[styles.groupPillChipText, { color: isSel ? theme.primary : theme.textSecondary }]}>
                    {gt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Compact Search & Category Filter Bar (Visible in GROUPED & LIST views) */}
        {viewMode !== 'CHART' && (
          <View style={styles.searchCatRow}>
            {/* Search Box */}
            <View style={[styles.searchBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Search size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search sub-category or store..."
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

            {/* Category Filter Pills (if multiple categories exist) */}
            {availableCategories.length > 2 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsScroll}>
                {availableCategories.map((cat) => {
                  const isActive = selectedCategoryFilter === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catFilterChip,
                        { backgroundColor: theme.cardBg, borderColor: theme.border },
                        isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                      onPress={() => setSelectedCategoryFilter(cat)}
                    >
                      <Text style={[styles.catFilterChipText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                        {cat === 'ALL' ? 'All Cats' : cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render Item for GROUPED Mode
  const renderGroupedItem = ({ item, index }: { item: any; index: number }) => {
    const sharePct = kpiStats.totalSalesAmount > 0 ? (item.sales_amount / kpiStats.totalSalesAmount) * 100 : 0;
    const barPct = maxGroupSalesAmount > 0 ? Math.min(100, Math.max(5, (item.sales_amount / maxGroupSalesAmount) * 100)) : 0;
    const isTopItem = index === 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleOpenDetailModal({ type: 'GROUPED', data: item })}
        style={[
          styles.recordCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isTopItem && { borderColor: '#ca8a04', borderWidth: 1.5 },
        ]}
      >
        {/* Header Row (Matches Day Wise Store Sale) */}
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.rankIconBox, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
              <Text style={[styles.rankText, { color: isTopItem ? '#ca8a04' : theme.primary }]}>#{index + 1}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.storeMetaText, { color: theme.textMuted }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
          </View>

          <View style={[styles.achPill, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]}>
            <Text style={[styles.achPillText, { color: theme.primary }]}>
              {sharePct.toFixed(1)}% Share
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
                  backgroundColor: isTopItem ? '#eab308' : '#10b981',
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
              {formatCurrency(item.sales_amount)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textMuted }]}>Total Quantity</Text>
            <Text style={[styles.mVal, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatNumber(item.total_qty)} Pcs
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textMuted }]}>Avg Selling Price</Text>
            <Text style={[styles.mVal, { color: '#10b981' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(item.asp)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textMuted }]}>Total Discount</Text>
            <Text style={[styles.mVal, { color: '#9333ea' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(item.discount)}
            </Text>
          </View>
        </View>

        {/* Store Breakdown Table Box */}
        {item.stores && item.stores.length > 0 ? (
          <View style={[styles.breakdownTableBox, { borderColor: theme.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Text style={[styles.thText, { color: theme.textSecondary, width: '45%' }]}>TOP STORE</Text>
              <Text style={[styles.thText, { color: theme.textSecondary, width: '25%', textAlign: 'right' }]}>QTY</Text>
              <Text style={[styles.thText, { color: theme.textSecondary, width: '30%', textAlign: 'right' }]}>REVENUE</Text>
            </View>

            {item.stores.slice(0, 3).map((s: any, sIdx: number) => (
              <View key={`${s.branch_code}-${sIdx}`} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.tdLabel, { color: theme.textPrimary, width: '45%' }]} numberOfLines={1}>
                  {s.branch_name}
                </Text>
                <Text style={[styles.tdVal, { color: theme.textSecondary, width: '25%', textAlign: 'right' }]}>
                  {formatNumber(s.total_qty)} Pcs
                </Text>
                <Text style={[styles.tdVal, { color: theme.primary, width: '30%', textAlign: 'right' }]}>
                  {formatCurrency(s.sales_amount)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  // Render Item for Raw LIST Mode
  const renderListItem = ({ item, index }: { item: BranchSubCategorySalesItem; index: number }) => {
    const sharePct = kpiStats.totalSalesAmount > 0 ? (item.sales_amount / kpiStats.totalSalesAmount) * 100 : 0;
    const barPct = maxListSalesAmount > 0 ? Math.min(100, Math.max(5, (item.sales_amount / maxListSalesAmount) * 100)) : 0;
    const asp = item.total_qty > 0 ? item.sales_amount / item.total_qty : 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleOpenDetailModal({ type: 'ITEM', data: item })}
        style={[styles.recordCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
      >
        {/* Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.rankIconBox, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
              <Text style={[styles.rankText, { color: theme.primary }]}>#{index + 1}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.sub_category}
              </Text>
              <Text style={[styles.storeMetaText, { color: theme.primary, fontWeight: '700' }]} numberOfLines={1}>
                🏬 {item.branch_name} • ({item.branch_code})
              </Text>
            </View>
          </View>

          <View style={[styles.achPill, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]}>
            <Text style={[styles.achPillText, { color: theme.primary }]}>
              {sharePct.toFixed(1)}% Share
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
                  backgroundColor: '#10b981',
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
              {formatCurrency(item.sales_amount)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textMuted }]}>Total Quantity</Text>
            <Text style={[styles.mVal, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatNumber(item.total_qty)} Pcs
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textMuted }]}>Avg Selling Price</Text>
            <Text style={[styles.mVal, { color: '#10b981' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(asp)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textMuted }]}>Total Discount</Text>
            <Text style={[styles.mVal, { color: '#9333ea' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(item.discount)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Branch Sub-Category Sales"
        subtitle={`Live API • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {isLoading && records.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Fetching store sub-category sales data...
          </Text>
        </View>
      ) : (
        <FlatList<any>
          data={viewMode === 'GROUPED' ? visibleGroupedRecords : viewMode === 'LIST' ? visibleListRecords : [1]}
          keyExtractor={(item, index) =>
            viewMode === 'GROUPED'
              ? `grouped-${item.key}-${index}`
              : viewMode === 'LIST'
              ? `${item.branch_code}-${item.sub_category}-${index}`
              : `view-${viewMode}`
          }
          renderItem={
            viewMode === 'GROUPED'
              ? renderGroupedItem
              : viewMode === 'LIST'
              ? (renderListItem as any)
              : () => (
                  <View style={{ marginTop: 8 }}>
                    {totals && <BranchSubCategorySalesVisualChart records={records} totals={totals} />}
                  </View>
                )
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            viewMode !== 'CHART' ? (
              <View style={styles.emptyBox}>
                <Package size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Sub-Category Sales Records Found</Text>
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
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* INTERACTIVE DETAIL MODAL */}
      <Modal
        visible={isDetailModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {selectedDetailItem?.data?.title || selectedDetailItem?.data?.sub_category}
                </Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Sub-Category Performance Breakdown
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsDetailModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14 }}>
                {/* Metric Cards Grid */}
                <View style={styles.modalKpiRow}>
                  <View style={[styles.modalKpiCard, { backgroundColor: theme.subtleBoxBg }]}>
                    <Text style={[styles.modalKpiLabel, { color: theme.textMuted }]}>TOTAL SALES</Text>
                    <Text style={[styles.modalKpiVal, { color: theme.primary }]}>
                      {formatCurrency(selectedDetailItem?.data?.sales_amount || 0)}
                    </Text>
                  </View>

                  <View style={[styles.modalKpiCard, { backgroundColor: theme.subtleBoxBg }]}>
                    <Text style={[styles.modalKpiLabel, { color: theme.textMuted }]}>UNITS SOLD</Text>
                    <Text style={[styles.modalKpiVal, { color: theme.textPrimary }]}>
                      {formatNumber(selectedDetailItem?.data?.total_qty || 0)}
                    </Text>
                  </View>

                  <View style={[styles.modalKpiCard, { backgroundColor: theme.subtleBoxBg }]}>
                    <Text style={[styles.modalKpiLabel, { color: theme.textMuted }]}>AVG PRICE (ASP)</Text>
                    <Text style={[styles.modalKpiVal, { color: '#10b981' }]}>
                      {formatCurrency(
                        selectedDetailItem?.data?.asp !== undefined
                          ? selectedDetailItem.data.asp
                          : selectedDetailItem?.data?.total_qty > 0
                          ? selectedDetailItem.data.sales_amount / selectedDetailItem.data.total_qty
                          : 0
                      )}
                    </Text>
                  </View>
                </View>

                {selectedDetailItem?.data?.stores && selectedDetailItem.data.stores.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.modalSectionHeader, { color: theme.textPrimary }]}>
                      Store Breakdown
                    </Text>
                    {selectedDetailItem.data.stores.map((s: any, idx: number) => {
                      const stShare = selectedDetailItem.data.sales_amount > 0
                        ? (s.sales_amount / selectedDetailItem.data.sales_amount) * 100
                        : 0;
                      return (
                        <View
                          key={s.branch_code + '-' + idx}
                          style={[styles.modalStoreRow, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.modalStoreName, { color: theme.textPrimary }]}>
                              {s.branch_name}
                            </Text>
                            <Text style={[styles.modalStoreSub, { color: theme.textMuted }]}>
                              Code: {s.branch_code} • {s.total_qty} Pcs
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.modalStoreAmt, { color: theme.textPrimary }]}>
                              {formatCurrency(s.sales_amount)}
                            </Text>
                            <Text style={[styles.modalStoreShare, { color: theme.primary }]}>
                              {stShare.toFixed(1)}% share
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* UNIFIED FILTER MODAL — Rendered at Root level outside FlatList */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Sub-Category Sales Filters"
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
        title="Select Branches for Sub-Category Sales"
        onApply={(codes) => {
          setSelectedBranchCodes(codes);
          loadData(fromDate, toDate, codes);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  flatListContent: {
    padding: 12,
    paddingBottom: 140,
    gap: 8,
  },
  listHeaderContainer: {
    gap: 8,
    marginBottom: 2,
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
  singleViewModeBar: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 3,
    borderWidth: 1,
  },
  singleTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
  },
  activeSingleTabBtn: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  singleTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  groupChipsScroll: {
    gap: 6,
    paddingVertical: 1,
  },
  groupPillChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  groupPillChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  searchCatRow: {
    gap: 6,
  },
  catChipsScroll: {
    gap: 6,
    paddingVertical: 1,
  },
  catFilterChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  catFilterChipText: {
    fontSize: 10,
    fontWeight: '700',
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

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  mCell: { width: '50%', padding: 4 },
  mLbl: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4 },
  mVal: { fontSize: 11.5, fontWeight: '800', marginTop: 1.5 },

  breakdownTableBox: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'space-between' },
  thText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  tdLabel: { fontSize: 10.5, fontWeight: '700' },
  tdVal: { fontSize: 11, fontWeight: '800' },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalContent: {
    paddingVertical: 14,
  },
  modalKpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalKpiCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  modalKpiLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  modalKpiVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  modalStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalStoreName: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalStoreSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalStoreAmt: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalStoreShare: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
