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
  fetchBranchHourlySales,
  BranchHourlySalesItem,
  BranchHourlySalesTotals,
} from '../api/branchHourlySalesApi';
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
  Table,
  Flame,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
} from 'lucide-react-native';

interface HourlyCell {
  net_sales: number;
  bill_count: number;
  sales_amount: number;
}

interface MatrixRow {
  branch_code: string;
  branch_name: string;
  hourly_data: Record<string, HourlyCell>;
  total_net_sales: number;
  total_bills: number;
  peak_hour_label: string;
  max_net_sales: number;
}

export const BranchWiseHourlySalesMatrixScreen: React.FC<{ navigation?: any }> = () => {
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
  const [records, setRecords] = useState<BranchHourlySalesItem[]>([]);
  const [totals, setTotals] = useState<BranchHourlySalesTotals | undefined>(undefined);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedStores, setExpandedStores] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'STORE_WISE' | 'CONSOLIDATED_SUM'>('CONSOLIDATED_SUM');

  // Toggle expanded store card state
  const toggleStoreExpand = (branchCode: string) => {
    setExpandedStores((prev) => ({
      ...prev,
      [branchCode]: !prev[branchCode],
    }));
  };

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

      const result = await fetchBranchHourlySales(params);

      if (result.isLive && Array.isArray(result.data)) {
        setRecords(result.data);
        setTotals(result.totals);
        setErrorMessage(null);
      } else {
        setRecords([]);
        setTotals(undefined);
        const errStr = result.error || 'Failed to connect to live hourly sales API.';
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

  // ─── PIVOT 2D MATRIX GENERATION ──────────────────────────────────────────────
  const { hourHeaders, matrixRows } = useMemo(() => {
    if (!records || records.length === 0) {
      return { hourHeaders: [], matrixRows: [] };
    }

    // 1. Collect & sort unique hour labels
    const hourMap = new Map<string, number>();
    records.forEach((r) => {
      const label = r.hour_label || `${r.hour}:00`;
      if (!hourMap.has(label)) {
        hourMap.set(label, r.hour);
      }
    });

    const sortedHours = Array.from(hourMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map((entry) => entry[0]);

    // 2. Group records by branch_code
    const branchMap = new Map<string, MatrixRow>();

    records.forEach((r) => {
      const bCode = r.branch_code || 'N/A';
      const bName = r.branch_name || `Store ${bCode}`;
      const hLabel = r.hour_label || `${r.hour}:00`;

      if (!branchMap.has(bCode)) {
        branchMap.set(bCode, {
          branch_code: bCode,
          branch_name: bName,
          hourly_data: {},
          total_net_sales: 0,
          total_bills: 0,
          peak_hour_label: '',
          max_net_sales: 0,
        });
      }

      const row = branchMap.get(bCode)!;
      row.hourly_data[hLabel] = {
        net_sales: r.net_sales,
        bill_count: r.bill_count,
        sales_amount: r.sales_amount,
      };

      row.total_net_sales += r.net_sales;
      row.total_bills += r.bill_count;

      if (r.net_sales > row.max_net_sales) {
        row.max_net_sales = r.net_sales;
        row.peak_hour_label = hLabel;
      }
    });

    const rowsArray = Array.from(branchMap.values());
    return { hourHeaders: sortedHours, matrixRows: rowsArray };
  }, [records]);

  // Client-side store search filtering
  const filteredMatrixRows = useMemo(() => {
    if (!searchQuery.trim()) return matrixRows;
    const q = searchQuery.toLowerCase().trim();
    return matrixRows.filter(
      (r) => r.branch_name.toLowerCase().includes(q) || r.branch_code.toLowerCase().includes(q)
    );
  }, [matrixRows, searchQuery]);

  // Consolidated Hourly Sum across ALL stores for each time slot
  const hourlyTimeSlotTotals = useMemo(() => {
    if (!hourHeaders || hourHeaders.length === 0 || !records || records.length === 0) {
      return { totalList: [], grandTotalNetSales: 0, grandTotalBills: 0, peakSlotLabel: '', maxSlotSales: 0 };
    }

    let grandTotalNetSales = 0;
    let grandTotalBills = 0;
    let maxSlotSales = 0;
    let peakSlotLabel = '';

    const slotMap = new Map<
      string,
      { hourLabel: string; hour: number; netSales: number; bills: number; grossSales: number; storeCount: Set<string> }
    >();

    hourHeaders.forEach((hLabel) => {
      const sampleItem = records.find((r) => (r.hour_label || `${r.hour}:00`) === hLabel);
      const hInt = sampleItem ? sampleItem.hour : parseInt(hLabel, 10) || 0;
      slotMap.set(hLabel, {
        hourLabel: hLabel,
        hour: hInt,
        netSales: 0,
        bills: 0,
        grossSales: 0,
        storeCount: new Set<string>(),
      });
    });

    records.forEach((r) => {
      const hLabel = r.hour_label || `${r.hour}:00`;
      const slot = slotMap.get(hLabel);
      if (slot) {
        slot.netSales += r.net_sales || 0;
        slot.bills += r.bill_count || 0;
        slot.grossSales += r.sales_amount || 0;
        if ((r.net_sales || 0) > 0 || (r.bill_count || 0) > 0) {
          slot.storeCount.add(r.branch_code || 'N/A');
        }
      }
    });

    const totalList = Array.from(slotMap.values()).map((slot) => {
      grandTotalNetSales += slot.netSales;
      grandTotalBills += slot.bills;
      if (slot.netSales > maxSlotSales) {
        maxSlotSales = slot.netSales;
        peakSlotLabel = slot.hourLabel;
      }
      return {
        hourLabel: slot.hourLabel,
        hour: slot.hour,
        netSales: slot.netSales,
        bills: slot.bills,
        grossSales: slot.grossSales,
        storeCount: slot.storeCount.size,
      };
    });

    totalList.sort((a, b) => a.hour - b.hour);

    return {
      totalList,
      grandTotalNetSales,
      grandTotalBills,
      peakSlotLabel,
      maxSlotSales,
    };
  }, [hourHeaders, records]);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Hourly Sales Velocity"
        subtitle={`Mobile View • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
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

      {/* KPI Cards Strip */}
      <View style={styles.kpiContainer}>
        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Total Revenue
          </Text>
          <Text style={[styles.kpiValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {formatCurrency(totals?.total_net_sales || 0)}
          </Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Peak Hour
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Flame size={12} color="#e11d48" style={{ marginRight: 2 }} />
            <Text style={[styles.kpiValue, { color: '#e11d48' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {totals?.peak_hour_label || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Active Stores
          </Text>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {matrixRows.length} Stores
          </Text>
        </View>
      </View>

      {/* Two Tab Switcher: "Store Wise" vs "Sum of All Stores" */}
      <View style={[styles.tabBarContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'STORE_WISE' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
          ]}
          onPress={() => setActiveTab('STORE_WISE')}
          activeOpacity={0.8}
        >
          <Building2 size={13} color={activeTab === 'STORE_WISE' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'STORE_WISE' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Store Wise Matrix
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'CONSOLIDATED_SUM' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
          ]}
          onPress={() => setActiveTab('CONSOLIDATED_SUM')}
          activeOpacity={0.8}
        >
          <Clock size={13} color={activeTab === 'CONSOLIDATED_SUM' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'CONSOLIDATED_SUM' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            All Stores Hourly Sum
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.controlsBar, { borderBottomColor: theme.border }]}>
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
      </View>

      {/* Main Content Area */}
      {isLoading && records.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Generating mobile hourly sales matrix...
          </Text>
        </View>
      ) : filteredMatrixRows.length === 0 ? (
        <View style={styles.emptyBox}>
          <Table size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Hourly Matrix Records</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Adjust date range or store filters to view hourly sales.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={true}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {/* TAB 1: CONSOLIDATED ALL STORES HOURLY SUM */}
          {activeTab === 'CONSOLIDATED_SUM' ? (
            <View style={styles.mobileCardsContainer}>
              <Text style={[styles.listHeaderTitle, { color: theme.textSecondary, marginBottom: 8 }]}>
                CONSOLIDATED ALL STORES HOURLY VELOCITY ({hourlyTimeSlotTotals.totalList.filter((s) => s.netSales > 0 || s.bills > 0).length} SLOTS)
              </Text>

              <View style={[styles.hourlyGridTableBox, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
                  <View style={[styles.hourlyGridHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Text style={[styles.hourlyGridHeaderCell, { color: theme.textSecondary, width: '32%' }]}>
                      Time Slot
                    </Text>
                    <Text style={[styles.hourlyGridHeaderCell, { color: theme.textSecondary, width: '15%', textAlign: 'center' }]}>
                      Stores
                    </Text>
                    <Text style={[styles.hourlyGridHeaderCell, { color: theme.textSecondary, width: '17%', textAlign: 'right' }]}>
                      Bills
                    </Text>
                    <Text style={[styles.hourlyGridHeaderCell, { color: theme.textSecondary, width: '36%', textAlign: 'right' }]}>
                      Total Net Sale
                    </Text>
                  </View>

                  {hourlyTimeSlotTotals.totalList.map((slot) => {
                    const isPeak = hourlyTimeSlotTotals.peakSlotLabel === slot.hourLabel && slot.netSales > 0;
                    const pctOfMax = hourlyTimeSlotTotals.maxSlotSales > 0 ? (slot.netSales / hourlyTimeSlotTotals.maxSlotSales) * 100 : 0;
                    const hasSales = slot.netSales > 0 || slot.bills > 0;

                    return (
                      <View
                        key={slot.hourLabel}
                        style={[
                          styles.hourlyGridRow,
                          { borderBottomColor: theme.border },
                          isPeak && { backgroundColor: isDark ? '#4c051933' : '#fff1f2' },
                        ]}
                      >
                        {/* Hour Label */}
                        <View style={{ width: '32%', flexDirection: 'row', alignItems: 'center' }}>
                          <Text
                            style={[
                              styles.hourlyGridCellText,
                              { color: theme.textPrimary, fontWeight: '800' },
                              isPeak && { fontWeight: '900', color: '#e11d48' },
                            ]}
                            numberOfLines={1}
                          >
                            {slot.hourLabel}
                          </Text>
                          {isPeak && <Flame size={11} color="#e11d48" style={{ marginLeft: 2 }} />}
                        </View>

                        {/* Store Count Badge */}
                        <View style={{ width: '15%', alignItems: 'center' }}>
                          {hasSales ? (
                            <View style={[styles.storeBadgePill, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', alignSelf: 'center' }]}>
                              <Text style={[styles.storeBadgePillText, { color: theme.primary, fontWeight: '900' }]}>
                                {slot.storeCount}
                              </Text>
                            </View>
                          ) : (
                            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textMuted }}>-</Text>
                          )}
                        </View>

                        {/* Total Bills Sum */}
                        <Text
                          style={[styles.hourlyGridCellText, { color: theme.textSecondary, width: '17%', textAlign: 'right', fontWeight: '800' }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {formatNumber(slot.bills)}
                        </Text>

                        {/* Total Net Sales Sum */}
                        <View style={{ width: '36%', alignItems: 'flex-end' }}>
                          <Text
                            style={[
                              styles.hourlyGridCellText,
                              { color: isPeak ? '#e11d48' : theme.primary, fontWeight: '900', textAlign: 'right' },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.65}
                          >
                            {formatCurrency(slot.netSales)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}

                  {/* Total Consolidated Sum Footer Row */}
                  <View style={[styles.hourlyGridRow, { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderTopWidth: 1, borderTopColor: theme.primary }]}>
                    <Text style={[styles.hourlyGridCellText, { color: theme.primary, width: '47%', fontWeight: '900' }]} numberOfLines={1}>
                      TOTAL MTD HOURLY
                    </Text>
                    <Text style={[styles.hourlyGridCellText, { color: theme.primary, width: '17%', textAlign: 'right', fontWeight: '800' }]} numberOfLines={1}>
                      {formatNumber(hourlyTimeSlotTotals.grandTotalBills)}
                    </Text>
                    <Text
                      style={[styles.hourlyGridCellText, { color: theme.primary, width: '36%', textAlign: 'right', fontWeight: '900' }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
                      {formatCurrency(hourlyTimeSlotTotals.grandTotalNetSales)}
                    </Text>
                  </View>
                </View>
            </View>
          ) : (
            /* TAB 2: STORE WISE MATRIX (EXISTING STORE CARDS - 100% UNTOUCHED) */
            <View style={styles.mobileCardsContainer}>
            {filteredMatrixRows.map((row, idx) => {
              const isExpanded = expandedStores[row.branch_code] ?? true;
              const activeHoursCount = hourHeaders.filter(
                (h) => (row.hourly_data[h]?.net_sales || 0) > 0 || (row.hourly_data[h]?.bill_count || 0) > 0
              ).length;

              return (
                <View
                  key={`${row.branch_code}-${idx}`}
                  style={[styles.storeCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                >
                  {/* Store Card Header */}
                  <TouchableOpacity
                    style={styles.storeCardHeader}
                    onPress={() => toggleStoreExpand(row.branch_code)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.storeCardTitle, { color: theme.textPrimary }]}>
                          {row.branch_name}
                        </Text>
                        <Text style={[styles.storeCardCode, { color: theme.textMuted }]}>
                          ({row.branch_code})
                        </Text>
                      </View>
                      <Text style={[styles.storeCardMetaText, { color: theme.textSecondary, marginTop: 2, fontWeight: '600' }]}>
                        {activeHoursCount} Active Sales Hours
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {row.peak_hour_label ? (
                        <View style={[styles.peakBadge, { backgroundColor: isDark ? '#4c0519' : '#ffe4e6' }]}>
                          <Flame size={11} color="#e11d48" style={{ marginRight: 2 }} />
                          <Text style={[styles.peakBadgeText, { color: '#e11d48' }]}>
                            Peak {row.peak_hour_label}
                          </Text>
                        </View>
                      ) : null}
                      {isExpanded ? (
                        <ChevronUp size={16} color={theme.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={theme.textMuted} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Expandable Compact Mobile Grid (Fits 100% of Screen Width) */}
                  {isExpanded && (
                    <View style={[styles.hourlyMobileGrid, { borderTopColor: theme.border }]}>
                      {/* Table Header inside Card */}
                      <View style={[styles.hourlyGridHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                        <Text style={[styles.hourlyGridHeaderCell, { color: theme.textSecondary, width: '35%' }]}>
                          Time Slot
                        </Text>
                        <Text style={[styles.hourlyGridHeaderCell, { color: theme.textSecondary, width: '35%', textAlign: 'right' }]}>
                          Net Sales
                        </Text>
                        <Text style={[styles.hourlyGridHeaderCell, { color: theme.textSecondary, width: '30%', textAlign: 'right' }]}>
                          Bills
                        </Text>
                      </View>

                      {/* Hourly Rows */}
                      {hourHeaders.map((hLabel) => {
                        const cell = row.hourly_data[hLabel];
                        const netSales = cell?.net_sales || 0;
                        const bills = cell?.bill_count || 0;
                        const isPeak = row.peak_hour_label === hLabel && netSales > 0;

                        if (netSales === 0 && bills === 0) return null; // Hide empty non-operating hours

                        return (
                          <View
                            key={hLabel}
                            style={[
                              styles.hourlyGridRow,
                              { borderBottomColor: theme.border },
                              isPeak && { backgroundColor: isDark ? '#064e3b22' : '#f0fdf4' },
                            ]}
                          >
                            {/* Hour Label */}
                            <View style={{ width: '35%', flexDirection: 'row', alignItems: 'center' }}>
                              <Text
                                style={[
                                  styles.hourlyGridCellText,
                                  { color: theme.textPrimary },
                                  isPeak && { fontWeight: '800', color: isDark ? '#6ee7b7' : '#047857' },
                                ]}
                              >
                                {hLabel}
                              </Text>
                              {isPeak && <Flame size={11} color="#e11d48" style={{ marginLeft: 3 }} />}
                            </View>

                            {/* Net Sales */}
                            <Text
                              style={[
                                styles.hourlyGridCellText,
                                { color: theme.textPrimary, width: '35%', textAlign: 'right' },
                                isPeak && { fontWeight: '800', color: isDark ? '#6ee7b7' : '#047857' },
                              ]}
                            >
                              {formatCurrency(netSales)}
                            </Text>

                            {/* Bills */}
                            <Text style={[styles.hourlyGridCellText, { color: theme.textSecondary, width: '30%', textAlign: 'right' }]}>
                              {formatNumber(bills)}
                            </Text>
                          </View>
                        );
                      })}

                      {/* Store Total Summary Footer Row */}
                      <View style={[styles.hourlyGridRow, { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderTopWidth: 1, borderTopColor: theme.primary }]}>
                        <Text style={[styles.hourlyGridCellText, { color: theme.primary, width: '35%', fontWeight: '800' }]}>
                          TOTAL
                        </Text>
                        <Text style={[styles.hourlyGridCellText, { color: theme.primary, width: '35%', textAlign: 'right', fontWeight: '800' }]}>
                          {formatCurrency(row.total_net_sales)}
                        </Text>
                        <Text style={[styles.hourlyGridCellText, { color: theme.primary, width: '30%', textAlign: 'right', fontWeight: '800' }]}>
                          {formatNumber(row.total_bills)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        </ScrollView>
      )}

      {/* UNIFIED FILTER MODAL */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Hourly Matrix Filters"
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
        title="Select Stores for Matrix"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  controlsBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchBox: {
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
  mobileCardsContainer: {
    padding: 12,
    paddingBottom: 40,
    gap: 10,
  },
  storeCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  storeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  storeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  storeCardCode: {
    fontSize: 11,
    fontWeight: '500',
  },
  storeCardMetaText: {
    fontSize: 11,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  peakBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  hourlyMobileGrid: {
    borderTopWidth: 1,
  },
  hourlyGridHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  hourlyGridHeaderCell: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  hourlyGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  hourlyGridCellText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabBarContainer: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
  },
  activeTabItem: {
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
  },
  storeBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  storeBadgePillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  hourlyGridTableBox: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
