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
  Alert,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { BranchSelectorModal } from '../components/modals/BranchSelectorModal';
import { UnifiedTopFilterBar } from '../components/common/UnifiedTopFilterBar';
import { UnifiedFilterModal } from '../components/common/UnifiedFilterModal';
import { StoreSelectionTriggerBadge } from '../components/common/StoreSelectionTriggerBadge';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import {
  fetchBranchDailySalesTrends,
  BranchDailySalesItem,
  BranchDailySalesTotals,
} from '../api/branchDailySalesApi';
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
  Flame,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react-native';

// ── Data Interfaces ──
interface DailyCell {
  net_sales: number;
  bill_count: number;
  sales_amount: number;
  return_amount: number;
  abv: number;
}

interface StoreDailyRow {
  branch_code: string;
  branch_name: string;
  daily_data: Record<string, DailyCell>;
  total_net_sales: number;
  total_bills: number;
  total_gross: number;
  total_returns: number;
  peak_date_label: string;
  max_net_sales: number;
  active_days: number;
  avg_daily_sales: number;
  avg_bill_value: number;
}

interface NetworkDayData {
  date: string;
  net_sales: number;
  bill_count: number;
  gross_sales: number;
  returns: number;
  abv: number;
  store_count: number;
  change_pct: number | null; // day-over-day % change
}

// ── Date helpers ──
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDateParts(dStr: string) {
  try {
    const d = new Date(dStr);
    return {
      day: d.getDate(),
      month: MONTHS_SHORT[d.getMonth()],
      weekday: WEEKDAYS[d.getDay()],
      short: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`,
    };
  } catch {
    return { day: 0, month: '', weekday: '', short: dStr };
  }
}

export const BranchWiseDailySalesMatrixScreen: React.FC<{ navigation?: any }> = () => {
  const { theme, isDark } = useTheme();

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

  const [records, setRecords] = useState<BranchDailySalesItem[]>([]);
  const [totals, setTotals] = useState<BranchDailySalesTotals | undefined>(undefined);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'NETWORK_PULSE' | 'STORE_WISE'>('NETWORK_PULSE');
  const [expandedStores, setExpandedStores] = useState<Record<string, boolean>>({});

  const toggleStoreExpand = (branchCode: string) => {
    setExpandedStores((prev) => ({ ...prev, [branchCode]: !prev[branchCode] }));
  };

  useEffect(() => {
    fetchBranches()
      .then((res) => { if (res.data && res.data.length > 0) setBranches(res.data); })
      .catch(() => {});
  }, []);

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

      const result = await fetchBranchDailySalesTrends(params);

      if (result.isLive && Array.isArray(result.data)) {
        setRecords(result.data);
        setTotals(result.totals);
        setErrorMessage(null);
      } else {
        setRecords([]);
        setTotals(undefined);
        const errStr = result.error || 'Failed to connect to live daily sales API.';
        setErrorMessage(errStr);
        if (showFeedback) Alert.alert('API Error', errStr);
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

  // ─── PIVOT + COMPUTE ─────────────────────────────
  const { dateHeaders, storeRows, networkDays, peakDateOverall, networkPeakSales } = useMemo(() => {
    if (!records || records.length === 0) {
      return { dateHeaders: [], storeRows: [], networkDays: [], peakDateOverall: 'N/A', networkPeakSales: 0 };
    }

    // 1. Unique sorted dates
    const datesSet = new Set<string>();
    records.forEach((r) => { if (r.date) datesSet.add(r.date); });
    const sortedDates = Array.from(datesSet).sort();

    // 2. Network day aggregates
    const dayAgg = new Map<string, { net_sales: number; bill_count: number; gross: number; returns: number; stores: Set<string> }>();
    sortedDates.forEach((d) => dayAgg.set(d, { net_sales: 0, bill_count: 0, gross: 0, returns: 0, stores: new Set() }));

    // 3. Per-store pivot
    const branchMap = new Map<string, StoreDailyRow>();
    let overallPeakDate = 'N/A';
    let overallMaxSales = 0;

    records.forEach((r) => {
      const bCode = r.branch_code || 'N/A';
      const bName = r.branch_name || `Store ${bCode}`;
      const dStr = r.date || 'N/A';

      // Network day agg
      const agg = dayAgg.get(dStr);
      if (agg) {
        agg.net_sales += r.net_sales;
        agg.bill_count += r.bill_count;
        agg.gross += r.sales_amount;
        agg.returns += r.return_amount;
        agg.stores.add(bCode);
      }

      if (!branchMap.has(bCode)) {
        branchMap.set(bCode, {
          branch_code: bCode,
          branch_name: bName,
          daily_data: {},
          total_net_sales: 0,
          total_bills: 0,
          total_gross: 0,
          total_returns: 0,
          peak_date_label: '',
          max_net_sales: 0,
          active_days: 0,
          avg_daily_sales: 0,
          avg_bill_value: 0,
        });
      }

      const row = branchMap.get(bCode)!;
      const abv = r.bill_count > 0 ? Math.round(r.net_sales / r.bill_count) : 0;
      row.daily_data[dStr] = {
        net_sales: r.net_sales,
        bill_count: r.bill_count,
        sales_amount: r.sales_amount,
        return_amount: r.return_amount,
        abv,
      };

      row.total_net_sales += r.net_sales;
      row.total_bills += r.bill_count;
      row.total_gross += r.sales_amount;
      row.total_returns += r.return_amount;

      if (r.net_sales > row.max_net_sales) {
        row.max_net_sales = r.net_sales;
        row.peak_date_label = dStr;
      }

      if (r.net_sales > overallMaxSales) {
        overallMaxSales = r.net_sales;
        overallPeakDate = dStr;
      }
    });

    // Compute derived store metrics
    branchMap.forEach((row) => {
      const activeDays = Object.values(row.daily_data).filter((c) => c.net_sales > 0 || c.bill_count > 0).length;
      row.active_days = activeDays;
      row.avg_daily_sales = activeDays > 0 ? Math.round(row.total_net_sales / activeDays) : 0;
      row.avg_bill_value = row.total_bills > 0 ? Math.round(row.total_net_sales / row.total_bills) : 0;
    });

    // Build network days array with day-over-day change
    const netDays: NetworkDayData[] = sortedDates.map((d, idx) => {
      const a = dayAgg.get(d)!;
      const prevSales = idx > 0 ? dayAgg.get(sortedDates[idx - 1])!.net_sales : null;
      const changePct = prevSales !== null && prevSales > 0
        ? Math.round(((a.net_sales - prevSales) / prevSales) * 100)
        : null;
      return {
        date: d,
        net_sales: a.net_sales,
        bill_count: a.bill_count,
        gross_sales: a.gross,
        returns: a.returns,
        abv: a.bill_count > 0 ? Math.round(a.net_sales / a.bill_count) : 0,
        store_count: a.stores.size,
        change_pct: changePct,
      };
    });

    // Find network peak day
    let netPeakSales = 0;
    netDays.forEach((nd) => { if (nd.net_sales > netPeakSales) netPeakSales = nd.net_sales; });

    const rowsArray = Array.from(branchMap.values());
    rowsArray.sort((a, b) => b.total_net_sales - a.total_net_sales);

    return { dateHeaders: sortedDates, storeRows: rowsArray, networkDays: netDays, peakDateOverall: overallPeakDate, networkPeakSales: netPeakSales };
  }, [records]);

  const filteredStoreRows = useMemo(() => {
    if (!searchQuery.trim()) return storeRows;
    const q = searchQuery.toLowerCase().trim();
    return storeRows.filter(
      (r) => r.branch_name.toLowerCase().includes(q) || r.branch_code.toLowerCase().includes(q)
    );
  }, [storeRows, searchQuery]);

  // ── Trend indicator ──
  const TrendBadge = ({ changePct }: { changePct: number | null }) => {
    if (changePct === null) return null;
    const isUp = changePct > 0;
    const isFlat = changePct === 0;
    const color = isFlat ? theme.textMuted : isUp ? '#16a34a' : '#ef4444';
    const bg = isFlat
      ? (isDark ? '#33415533' : '#f1f5f9')
      : isUp
        ? (isDark ? '#064e3b44' : '#f0fdf4')
        : (isDark ? '#450a0a44' : '#fef2f2');
    return (
      <View style={[styles.trendBadge, { backgroundColor: bg }]}>
        {!isFlat && (isUp
          ? <TrendingUp size={9} color={color} style={{ marginRight: 2 }} />
          : <TrendingDown size={9} color={color} style={{ marginRight: 2 }} />
        )}
        <Text style={[styles.trendBadgeText, { color }]}>
          {isFlat ? '0%' : `${isUp ? '+' : ''}${changePct}%`}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Daily Sales Matrix"
        subtitle={`Store Trends • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
        <UnifiedTopFilterBar
          fromDate={fromDate}
          toDate={toDate}
          extraPills={[{ icon: Building2, label: getStoreFilterLabel(selectedBranchCodes, branches) }]}
          onToggleFilters={openFilterModal}
          onRefreshData={() => loadData()}
          showExport={false}
        />
      </View>

      {/* Two Tab Switcher: "Network Daily Pulse" vs "Store Wise Matrix" */}
      <View style={[styles.tabBarContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'NETWORK_PULSE' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
          ]}
          onPress={() => setActiveTab('NETWORK_PULSE')}
          activeOpacity={0.8}
        >
          <Activity size={13} color={activeTab === 'NETWORK_PULSE' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'NETWORK_PULSE' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Network Daily Pulse
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
      </View>

      {/* Main Content */}
      {isLoading && records.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading daily sales matrix...</Text>
        </View>
      ) : storeRows.length === 0 && !isLoading ? (
        <View style={styles.emptyBox}>
          <Calendar size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Daily Sales Records</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Adjust date range or store filters to view daily sales.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {/* Executive Summary Banner */}
          <View style={[styles.heroBanner, { backgroundColor: isDark ? '#0f172a' : '#eef2ff', borderColor: isDark ? '#334155' : '#c7d2fe' }]}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroLabel, { color: isDark ? '#93c5fd' : '#4f46e5' }]}>
                  Network Net Sales
                </Text>
                <Text
                  style={[styles.heroValue, { color: isDark ? '#e0e7ff' : '#312e81' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {formatCurrency(totals?.total_net_sales || 0)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.heroChip, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                  <Text style={[styles.heroChipText, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                    {storeRows.length} Stores
                  </Text>
                </View>
                <View style={[styles.heroChip, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                  <Text style={[styles.heroChipText, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                    {dateHeaders.length} Days
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 4-KPI Row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Total Bills</Text>
              <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {formatNumber(totals?.total_bill_count || 0)}
              </Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Avg/Day</Text>
              <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {formatCurrency(totals?.avg_daily_sales || 0)}
              </Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Gross Sales</Text>
              <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {formatCurrency(totals?.total_sales_amount || 0)}
              </Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Returns</Text>
              <Text style={[styles.kpiValue, { color: (totals?.total_return_amount || 0) > 0 ? '#ef4444' : theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {formatCurrency(totals?.total_return_amount || 0)}
              </Text>
            </View>
          </View>

          {/* TAB 1: NETWORK DAILY PULSE */}
          {activeTab === 'NETWORK_PULSE' && (
            networkDays.length > 0 ? (
              <View style={styles.networkSection}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  Network Daily Pulse
                </Text>
                <View style={[styles.networkCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={[styles.networkHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Text style={[styles.networkHeaderCell, { color: theme.textSecondary, flex: 2 }]}>Day</Text>
                    <Text style={[styles.networkHeaderCell, { color: theme.textSecondary, flex: 2.5, textAlign: 'right' }]}>Net Sales</Text>
                    <Text style={[styles.networkHeaderCell, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Bills</Text>
                    <Text style={[styles.networkHeaderCell, { color: theme.textSecondary, flex: 1.5, textAlign: 'right' }]}>D/D</Text>
                  </View>

                  {networkDays.map((nd, idx) => {
                    const isPeak = nd.net_sales === networkPeakSales && nd.net_sales > 0;
                    const barPct = networkPeakSales > 0 ? (nd.net_sales / networkPeakSales) * 100 : 0;
                    const dp = parseDateParts(nd.date);

                    return (
                      <View
                        key={nd.date}
                        style={[
                          styles.networkRow,
                          { borderBottomColor: theme.border },
                          idx === networkDays.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View
                          style={[
                            styles.networkRowBar,
                            {
                              width: `${barPct}%`,
                              backgroundColor: isPeak
                                ? (isDark ? '#065f4622' : '#dcfce7')
                                : (isDark ? '#1e40af11' : '#eff6ff55'),
                            },
                          ]}
                        />
                        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
                          <View>
                            <Text style={[styles.networkCellText, { color: theme.textPrimary }, isPeak && { fontWeight: '800', color: isDark ? '#6ee7b7' : '#047857' }]}>
                              {dp.short}
                            </Text>
                            <Text style={[styles.networkCellSub, { color: theme.textMuted }]}>{dp.weekday}</Text>
                          </View>
                          {isPeak && <Flame size={10} color="#e11d48" style={{ marginLeft: 4 }} />}
                        </View>
                        <Text
                          style={[styles.networkCellText, { flex: 2.5, textAlign: 'right', color: theme.textPrimary, zIndex: 1 }, isPeak && { fontWeight: '800', color: isDark ? '#6ee7b7' : '#047857' }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {formatCurrency(nd.net_sales)}
                        </Text>
                        <Text style={[styles.networkCellText, { flex: 1, textAlign: 'right', color: theme.textSecondary, zIndex: 1 }]}>
                          {formatNumber(nd.bill_count)}
                        </Text>
                        <View style={{ flex: 1.5, alignItems: 'flex-end', zIndex: 1 }}>
                          <TrendBadge changePct={nd.change_pct} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null
          )}

          {/* TAB 2: STORE WISE MATRIX */}
          {activeTab === 'STORE_WISE' && (
            <>
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
                  {filteredStoreRows.length} of {storeRows.length}
                </Text>
              </View>

              {filteredStoreRows.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textMuted }}>
                    No stores match "{searchQuery}"
                  </Text>
                </View>
              ) : (
                <View style={styles.cardsContainer}>
                  {filteredStoreRows.map((row, storeIdx) => {
                    const isExpanded = expandedStores[row.branch_code] ?? true;

                    const storeDates = dateHeaders
                      .filter((d) => {
                        const c = row.daily_data[d];
                        return c && (c.net_sales > 0 || c.bill_count > 0);
                      });

                    return (
                      <View
                        key={`${row.branch_code}-${storeIdx}`}
                        style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      >
                        <TouchableOpacity
                          style={styles.cardHeader}
                          onPress={() => toggleStoreExpand(row.branch_code)}
                          activeOpacity={0.8}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={[styles.rankPill, { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: theme.border }]}>
                                <Text style={[styles.rankPillText, { color: theme.textSecondary }]}>#{storeIdx + 1}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                                  {row.branch_name}
                                </Text>
                                <Text style={[styles.cardCode, { color: theme.textMuted }]}>
                                  {row.branch_code} • {row.active_days} of {dateHeaders.length} days active
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            {row.peak_date_label ? (
                              <View style={[styles.peakBadge, { backgroundColor: isDark ? '#4c0519' : '#ffe4e6' }]}>
                                <Flame size={10} color="#e11d48" style={{ marginRight: 2 }} />
                                <Text style={[styles.peakBadgeText, { color: '#e11d48' }]}>
                                  {parseDateParts(row.peak_date_label).short}
                                </Text>
                              </View>
                            ) : null}
                            {isExpanded
                              ? <ChevronUp size={14} color={theme.textMuted} />
                              : <ChevronDown size={14} color={theme.textMuted} />
                            }
                          </View>
                        </TouchableOpacity>

                        <View style={[styles.storeSummary, { backgroundColor: isDark ? '#1e293b44' : '#f8fafc', borderColor: theme.border }]}>
                          <View style={styles.summaryCell}>
                            <Text style={[styles.summaryCellLabel, { color: theme.textMuted }]}>Net Sales</Text>
                            <Text style={[styles.summaryCellValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                              {formatCurrency(row.total_net_sales)}
                            </Text>
                          </View>
                          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                          <View style={styles.summaryCell}>
                            <Text style={[styles.summaryCellLabel, { color: theme.textMuted }]}>Bills</Text>
                            <Text style={[styles.summaryCellValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                              {formatNumber(row.total_bills)}
                            </Text>
                          </View>
                          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                          <View style={styles.summaryCell}>
                            <Text style={[styles.summaryCellLabel, { color: theme.textMuted }]}>Avg/Day</Text>
                            <Text style={[styles.summaryCellValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                              {formatCurrency(row.avg_daily_sales)}
                            </Text>
                          </View>
                        </View>

                        {isExpanded && storeDates.length > 0 && (
                          <View style={[styles.dailyGrid, { borderTopColor: theme.border }]}>
                            <View style={[styles.gridHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                              <Text style={[styles.gridHeaderCell, { color: theme.textSecondary, flex: 3 }]}>Date</Text>
                              <Text style={[styles.gridHeaderCell, { color: theme.textSecondary, flex: 3.5, textAlign: 'right' }]}>Net Sales</Text>
                              <Text style={[styles.gridHeaderCell, { color: theme.textSecondary, flex: 2, textAlign: 'right' }]}>Bills</Text>
                            </View>

                            {storeDates.map((dStr, dateIdx) => {
                              const cell = row.daily_data[dStr]!;
                              const isPeak = row.peak_date_label === dStr && cell.net_sales > 0;
                              const barPct = row.max_net_sales > 0 ? (cell.net_sales / row.max_net_sales) * 100 : 0;
                              const dp = parseDateParts(dStr);

                              const prevDate = dateIdx > 0 ? storeDates[dateIdx - 1] : null;
                              const prevSales = prevDate ? (row.daily_data[prevDate]?.net_sales || 0) : null;
                              const dodPct = prevSales !== null && prevSales > 0
                                ? Math.round(((cell.net_sales - prevSales) / prevSales) * 100)
                                : null;

                              return (
                                <View
                                  key={dStr}
                                  style={[styles.gridRow, { borderBottomColor: theme.border }]}
                                >
                                  <View
                                    style={[
                                      styles.gridRowBar,
                                      {
                                        width: `${barPct}%`,
                                        backgroundColor: isPeak
                                          ? (isDark ? '#065f4622' : '#dcfce7')
                                          : (isDark ? '#1e40af11' : '#eff6ff55'),
                                      },
                                    ]}
                                  />
                                  <View style={{ flex: 3, zIndex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={[styles.gridCellText, { color: theme.textPrimary }, isPeak && { fontWeight: '800', color: isDark ? '#6ee7b7' : '#047857' }]}>
                                        {dp.short}
                                      </Text>
                                      {isPeak && <Flame size={10} color="#e11d48" style={{ marginLeft: 3 }} />}
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                                      <Text style={[styles.gridCellSub, { color: theme.textMuted }]}>{dp.weekday}</Text>
                                      {dodPct !== null && <TrendBadge changePct={dodPct} />}
                                    </View>
                                  </View>
                                  <Text
                                    style={[
                                      styles.gridCellText,
                                      { flex: 3.5, textAlign: 'right', color: theme.textPrimary, zIndex: 1 },
                                      isPeak && { fontWeight: '800', color: isDark ? '#6ee7b7' : '#047857' },
                                    ]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                  >
                                    {formatCurrency(cell.net_sales)}
                                  </Text>
                                  <Text style={[styles.gridCellText, { flex: 2, textAlign: 'right', color: theme.textSecondary, zIndex: 1 }]}>
                                    {formatNumber(cell.bill_count)}
                                  </Text>
                                </View>
                              );
                            })}

                            <View style={[styles.gridRow, styles.gridFooter, { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderTopWidth: 1, borderTopColor: theme.primary }]}>
                              <Text style={[styles.gridCellText, { flex: 3, fontWeight: '800', color: theme.primary, zIndex: 1 }]}>
                                TOTAL
                              </Text>
                              <Text style={[styles.gridCellText, { flex: 3.5, textAlign: 'right', fontWeight: '800', color: theme.primary, zIndex: 1 }]}>
                                {formatCurrency(row.total_net_sales)}
                              </Text>
                              <Text style={[styles.gridCellText, { flex: 2, textAlign: 'right', fontWeight: '800', color: theme.primary, zIndex: 1 }]}>
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
            </>
          )}
        </ScrollView>
      )}

      {/* Filter Modals */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Daily Matrix Filters"
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
          onPress={() => { closeFilterModal(); setIsBranchModalOpen(true); }}
        />
      </UnifiedFilterModal>

      <BranchSelectorModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        selectedBranchCodes={selectedBranchCodes}
        onApply={(newCodes) => { setSelectedBranchCodes(newCodes); loadData(newCodes); }}
        title="Select Stores for Daily Matrix"
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
  tabBarContainer: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroBanner: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  heroChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 0,
  },
  storeCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardCode: {
    fontSize: 11,
    marginTop: 1,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  peakBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  storeSummary: {
    flexDirection: 'row',
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCellLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  summaryCellValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: '100%',
  },
  dailyGrid: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  gridHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  gridHeaderCell: {
    fontSize: 11,
    fontWeight: '800',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    position: 'relative',
  },
  gridRowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  gridCellText: {
    fontSize: 12,
  },
  gridCellSub: {
    fontSize: 10,
  },
  gridFooter: {
    paddingVertical: 8,
    marginTop: 4,
  },
  networkSection: {
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  networkCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  networkHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  networkHeaderCell: {
    fontSize: 11,
    fontWeight: '800',
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    position: 'relative',
  },
  networkRowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  networkCellText: {
    fontSize: 12,
  },
  networkCellSub: {
    fontSize: 10,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
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
});
