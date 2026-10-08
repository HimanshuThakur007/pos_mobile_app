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
  FlatList,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { DatePickerModal } from '../components/modals/DatePickerModal';
import { UnifiedTopFilterBar } from '../components/common/UnifiedTopFilterBar';
import { UnifiedFilterModal } from '../components/common/UnifiedFilterModal';
import { StoreSelectionTriggerBadge } from '../components/common/StoreSelectionTriggerBadge';
import { BranchSelectorModal } from '../components/modals/BranchSelectorModal';
import { useGlobalFilter, DatePreset } from '../context/GlobalFilterContext';
import { Badge } from '../components/Badge';
import { fetchBillComparison, fetchBranches, BillComparisonItem, BranchItem } from '../api/comparisonApi';
import { formatDateToYYYYMMDD, formatCurrency, formatNumber, getStoreFilterLabel } from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import {
  Receipt,
  Building2,
  AlertTriangle,
  TrendingUp,
  Hash,
  ChevronDown,
  Laptop,
  Smartphone,
  Server,
  Database,
  Search,
  X,
  CalendarCheck,
  Store,
  Award,
  Sparkles,
  ShieldCheck,
} from 'lucide-react-native';

const INITIAL_PAGE_SIZE = 25;

export const BillComparisonScreen: React.FC<{ navigation?: any }> = () => {
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

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Active Tab state matching DayWiseStoreSaleScreen ('SHOW_ALL' | 'STORE_WISE')
  const [activeTab, setActiveTab] = useState<'SHOW_ALL' | 'STORE_WISE'>('SHOW_ALL');

  // Input states
  const [fyCode, setFyCode] = useState<string>('20262027');

  // Date Picker Modal State
  const [activePickerTarget, setActivePickerTarget] = useState<'FROM' | 'TO' | null>(null);

  // Search & Status filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCHED' | 'DISCREPANCY'>('ALL');
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE);

  // Data state
  const [records, setRecords] = useState<BillComparisonItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load available branches list on mount
  useEffect(() => {
    fetchBranches()
      .then((res) => {
        if (res.data && res.data.length > 0) setBranches(res.data);
      })
      .catch(() => {});
  }, []);

  // Core API loader
  const loadData = useCallback(
    async (showFeedback = false, overrideFrom?: string, overrideTo?: string) => {
      setIsLoading(true);
      setErrorMessage(null);

      const fDate = overrideFrom || fromDate;
      const tDate = overrideTo || toDate;

      const res = await fetchBillComparison({
        from: fDate,
        to: tDate,
        fy_code: fyCode,
      });

      if (res.isLive) {
        setRecords(res.data);
        setIsLiveApi(true);
        closeFilterModal();
      } else {
        setIsLiveApi(false);
        setRecords([]);
        setErrorMessage(res.error || 'Failed to connect to live POS Bill Comparison API.');
      }
      setIsLoading(false);
    },
    [fromDate, toDate, fyCode, closeFilterModal]
  );

  const isFocused = useIsFocused();
  const lastFilterKeyRef = useRef<string>('');
  const currentFilterKey = `${fromDate}_${toDate}_${selectedBranchCodes.join(',')}_${fyCode}`;

  // React to global filter changes & initial mount when focused
  useEffect(() => {
    if (isFocused && lastFilterKeyRef.current !== currentFilterKey) {
      lastFilterKeyRef.current = currentFilterKey;
      loadData(false);
    }
  }, [isFocused, currentFilterKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const handleApplyClick = () => {
    setDisplayLimit(INITIAL_PAGE_SIZE);
    loadData(true);
  };

  const handleApplyPreset = (preset: DatePreset) => {
    setSelectedPreset(preset);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'TODAY') {
      start = now;
      end = now;
    } else if (preset === 'YESTERDAY') {
      start = new Date(now.setDate(now.getDate() - 1));
      end = start;
    } else if (preset === 'LAST7') {
      start = new Date(now.setDate(now.getDate() - 6));
      end = new Date();
    } else if (preset === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    }

    const startStr = formatDateToYYYYMMDD(start);
    const endStr = formatDateToYYYYMMDD(end);

    setFromDate(startStr);
    setToDate(endStr);
    setDisplayLimit(INITIAL_PAGE_SIZE);

    loadData(true, startStr, endStr);
  };

  const handleResetFilters = () => {
    const today = formatDateToYYYYMMDD(new Date());
    setFromDate(today);
    setToDate(today);
    setSearchQuery('');
    setStatusFilter('ALL');
    setFyCode('20262027');
    setSelectedPreset('TODAY');
    setSelectedBranchCodes([]);
    setDisplayLimit(INITIAL_PAGE_SIZE);
    loadData(true, today, today);
  };

  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return records.filter((item) => {
      const storeName = (item.branch_name || item.store_name || item.branch_code || '').toLowerCase();
      const code = String(item.branch_code || '').toLowerCase();
      const dateStr = String(item.bill_date || item.date || '').toLowerCase();

      const matchesSearch =
        !query || storeName.includes(query) || code.includes(query) || dateStr.includes(query);

      const matchesBranch =
        selectedBranchCodes.length === 0 || selectedBranchCodes.includes(String(item.branch_code));

      const central = Number(item.central_count ?? 0);
      const erp = Number(item.erp_count ?? 0);

      const hasDiscrepancy =
        central !== erp ||
        (item.discrepancy_count && item.discrepancy_count > 0) ||
        (item.status && item.status.toUpperCase().includes('MISMATCH')) ||
        (item.status && item.status.toUpperCase().includes('DISCREPANCY'));

      if (statusFilter === 'MATCHED' && hasDiscrepancy) return false;
      if (statusFilter === 'DISCREPANCY' && !hasDiscrepancy) return false;

      return matchesSearch && matchesBranch;
    });
  }, [records, searchQuery, statusFilter, selectedBranchCodes]);

  // Consolidated Daily Sales / Date-wise Matrix across all stores (Tab 1: SHOW_ALL)
  const consolidatedDailySales = useMemo(() => {
    let grandTotalCentral = 0;
    let grandTotalErp = 0;
    let grandTotalDesktop = 0;
    let grandTotalPos = 0;
    let grandTotalAmount = 0;
    let maxDayAmount = 0;

    const dateMap: Record<
      string,
      {
        dateStr: string;
        centralCount: number;
        erpCount: number;
        desktopCount: number;
        posCount: number;
        totalAmount: number;
        storeCount: number;
        discrepancyCount: number;
        storeItems: BillComparisonItem[];
      }
    > = {};

    filteredRecords.forEach((r) => {
      const dateKey = r.bill_date || r.date || 'Unknown Date';
      const desktop = Number(r.desktop_app_count ?? r.desktop_count ?? r.desktop_app ?? 0);
      const pos = Number(r.pos_count ?? r.pos_app_count ?? r.pos_bills ?? 0);
      const central = Number(r.central_count ?? r.total_bills ?? r.central_total ?? r.central ?? 0);
      const erp = Number(r.erp_count ?? r.pos_bill_count ?? r.erp_total ?? r.erp ?? 0);
      const amt = Number(r.total_amount ?? r.pos_total_amount ?? r.amount ?? r.net_amount ?? 0);
      const isMismatch = central !== erp;

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          dateStr: dateKey,
          centralCount: 0,
          erpCount: 0,
          desktopCount: 0,
          posCount: 0,
          totalAmount: 0,
          storeCount: 0,
          discrepancyCount: 0,
          storeItems: [],
        };
      }

      dateMap[dateKey].centralCount += central;
      dateMap[dateKey].erpCount += erp;
      dateMap[dateKey].desktopCount += desktop;
      dateMap[dateKey].posCount += pos;
      dateMap[dateKey].totalAmount += amt;
      dateMap[dateKey].storeCount += 1;
      if (isMismatch) dateMap[dateKey].discrepancyCount += 1;
      dateMap[dateKey].storeItems.push(r);

      grandTotalCentral += central;
      grandTotalErp += erp;
      grandTotalDesktop += desktop;
      grandTotalPos += pos;
      grandTotalAmount += amt;
      if (amt > maxDayAmount) maxDayAmount = amt;
    });

    const daysData = Object.values(dateMap).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    return {
      grandTotalCentral,
      grandTotalErp,
      grandTotalDesktop,
      grandTotalPos,
      grandTotalAmount,
      maxDayAmount,
      daysData,
    };
  }, [filteredRecords]);

  // Grouped by Store Matrix (Tab 2: STORE_WISE)
  const storeWiseMatrix = useMemo(() => {
    const storeMap: Record<
      string,
      {
        branchCode: string;
        branchName: string;
        centralCount: number;
        erpCount: number;
        desktopCount: number;
        posCount: number;
        totalAmount: number;
        daysCount: number;
        discrepancyCount: number;
        items: BillComparisonItem[];
      }
    > = {};

    filteredRecords.forEach((r) => {
      const code = String(r.branch_code || 'N/A');
      const name = r.branch_name || r.store_name || `Store #${code}`;
      const desktop = Number(r.desktop_app_count ?? r.desktop_count ?? r.desktop_app ?? 0);
      const pos = Number(r.pos_count ?? r.pos_app_count ?? r.pos_bills ?? 0);
      const central = Number(r.central_count ?? r.total_bills ?? r.central_total ?? r.central ?? 0);
      const erp = Number(r.erp_count ?? r.pos_bill_count ?? r.erp_total ?? r.erp ?? 0);
      const amt = Number(r.total_amount ?? r.pos_total_amount ?? r.amount ?? r.net_amount ?? 0);
      const isMismatch = central !== erp;

      if (!storeMap[code]) {
        storeMap[code] = {
          branchCode: code,
          branchName: name,
          centralCount: 0,
          erpCount: 0,
          desktopCount: 0,
          posCount: 0,
          totalAmount: 0,
          daysCount: 0,
          discrepancyCount: 0,
          items: [],
        };
      }

      storeMap[code].centralCount += central;
      storeMap[code].erpCount += erp;
      storeMap[code].desktopCount += desktop;
      storeMap[code].posCount += pos;
      storeMap[code].totalAmount += amt;
      storeMap[code].daysCount += 1;
      if (isMismatch) storeMap[code].discrepancyCount += 1;
      storeMap[code].items.push(r);
    });

    return Object.values(storeMap).sort((a, b) => b.centralCount - a.centralCount);
  }, [filteredRecords]);

  // Executive Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalBills = 0;
    let totalAmount = 0;
    let discrepancyCount = 0;
    let matchedCount = 0;
    let totalCentral = 0;
    let totalErp = 0;
    let totalDesktop = 0;
    let totalPos = 0;

    filteredRecords.forEach((r) => {
      const desktop = Number(r.desktop_app_count ?? r.desktop_count ?? r.desktop_app ?? 0);
      const pos = Number(r.pos_count ?? r.pos_app_count ?? r.pos_bills ?? 0);
      const central = Number(r.central_count ?? 0);
      const erp = Number(r.erp_count ?? 0);
      totalCentral += central;
      totalErp += erp;
      totalDesktop += desktop;
      totalPos += pos;
      totalBills += central;
      totalAmount += Number(r.total_amount ?? 0);

      const isDiscrepant =
        central !== erp ||
        (r.discrepancy_count && r.discrepancy_count > 0) ||
        (r.status && r.status.toUpperCase().includes('MISMATCH')) ||
        (r.status && r.status.toUpperCase().includes('DISCREPANCY'));

      if (isDiscrepant) {
        discrepancyCount++;
      } else {
        matchedCount++;
      }
    });

    const totalStores = filteredRecords.length;
    const syncAccuracy = totalStores > 0 ? Number(((matchedCount / totalStores) * 100).toFixed(1)) : 100;

    return {
      totalStores,
      totalBills,
      totalAmount,
      discrepancyCount,
      matchedCount,
      totalCentral,
      totalErp,
      totalDesktop,
      totalPos,
      syncAccuracy,
    };
  }, [filteredRecords]);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Bill Comparison"
        subtitle={`FY ${fyCode} • Day Wise Store Sale Matrix`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {/* Control Bar & Search (Matches DayWiseStoreSaleScreen) */}
      <View style={[styles.controlBar, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
        <UnifiedTopFilterBar
          fromDate={fromDate}
          toDate={toDate}
          extraPills={[
            { icon: Building2, label: getStoreFilterLabel(selectedBranchCodes, branches) },
            { icon: Hash, label: `FY ${fyCode}` },
          ]}
          onToggleFilters={openFilterModal}
          onRefreshData={handleApplyClick}
        />
      </View>

      {/* Two Tab Switcher: "Show All (Day-Wise)" vs "Store Wise Matrix" (Matches DayWiseStoreSaleScreen) */}
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
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'SHOW_ALL' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Show All (Day-Wise)
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
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'STORE_WISE' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Store Wise Matrix ({storeWiseMatrix.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && records.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching Bill Comparison Matrix...</Text>
        </View>
      ) : errorMessage && records.length === 0 ? (
        <View style={styles.errorBox}>
          <AlertTriangle size={32} color="#dc2626" style={{ marginBottom: 8 }} />
          <Text style={styles.errorTitle}>Failed to Load Summary</Text>
          <Text style={styles.errorSub}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleApplyClick}>
            <Text style={styles.retryBtnText}>Retry API Request</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {/* Executive KPI Summary Cards Strip (Matches DayWiseStoreSaleScreen) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 12 }}>
            <View style={styles.kpiWrap}>
              {/* Card 1: Total Audited Stores */}
              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#fff7ed', borderColor: '#fed7aa' }]}>
                <View style={[styles.iconWrap, { backgroundColor: '#ffedd5' }]}>
                  <Building2 size={12} color="#c55a11" />
                </View>
                <View>
                  <Text style={[styles.kLabel, { color: '#c55a11' }]}>TOTAL AUDITED</Text>
                  <Text style={[styles.kValue, { color: '#9a3412' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatNumber(summaryMetrics.totalStores)} Summaries
                  </Text>
                </View>
              </View>

              {/* Card 2: Desktop Bills */}
              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <View style={[styles.iconWrap, { backgroundColor: '#dcfce7' }]}>
                  <Laptop size={12} color="#16a34a" />
                </View>
                <View>
                  <Text style={[styles.kLabel, { color: '#15803d' }]}>DESKTOP BILLS</Text>
                  <Text style={[styles.kValue, { color: '#166534' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatNumber(summaryMetrics.totalDesktop)}
                  </Text>
                </View>
              </View>

              {/* Card 3: POS App Bills */}
              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#faf5ff', borderColor: '#e9d5ff' }]}>
                <View style={[styles.iconWrap, { backgroundColor: '#f3e8ff' }]}>
                  <Smartphone size={12} color="#9333ea" />
                </View>
                <View>
                  <Text style={[styles.kLabel, { color: '#7e22ce' }]}>POS APP BILLS</Text>
                  <Text style={[styles.kValue, { color: '#6b21a8' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatNumber(summaryMetrics.totalPos)}
                  </Text>
                </View>
              </View>

              {/* Card 4: Central Invoices */}
              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#ecfdf5', borderColor: '#a7f3d0' }]}>
                <View style={[styles.iconWrap, { backgroundColor: '#d1fae5' }]}>
                  <Server size={12} color="#059669" />
                </View>
                <View>
                  <Text style={[styles.kLabel, { color: '#047857' }]}>CENTRAL INVOICES</Text>
                  <Text style={[styles.kValue, { color: '#065f46' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatNumber(summaryMetrics.totalCentral)}
                  </Text>
                </View>
              </View>

              {/* Card 5: ERP Invoices */}
              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#bfdbfe' }]}>
                <View style={[styles.iconWrap, { backgroundColor: '#dbeafe' }]}>
                  <Database size={12} color="#1d4ed8" />
                </View>
                <View>
                  <Text style={[styles.kLabel, { color: '#1e40af' }]}>ERP INVOICES</Text>
                  <Text style={[styles.kValue, { color: '#1e3a8a' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatNumber(summaryMetrics.totalErp)}
                  </Text>
                </View>
              </View>

              {/* Card 6: Total Revenue */}
              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#fefce8', borderColor: '#fef08a' }]}>
                <View style={[styles.iconWrap, { backgroundColor: '#fef9c3' }]}>
                  <TrendingUp size={12} color="#ca8a04" />
                </View>
                <View>
                  <Text style={[styles.kLabel, { color: '#a16207' }]}>TOTAL SALES</Text>
                  <Text style={[styles.kValue, { color: '#713f12' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatCurrency(summaryMetrics.totalAmount)}
                  </Text>
                </View>
              </View>

              {/* Card 7: Discrepancies */}
              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#fef2f2', borderColor: '#fca5a5' }]}>
                <View style={[styles.iconWrap, { backgroundColor: '#fee2e2' }]}>
                  <AlertTriangle size={12} color="#dc2626" />
                </View>
                <View>
                  <Text style={[styles.kLabel, { color: '#991b1b' }]}>MISMATCHES</Text>
                  <Text style={[styles.kValue, { color: '#991b1b' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {summaryMetrics.discrepancyCount} Stores
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Compact Search Bar */}
          <View style={{ paddingHorizontal: 12, marginBottom: 10 }}>
            <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Search size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search store code, name, or date..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={13} color={theme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* TAB 1: SHOW ALL (Consolidated Daily Sales Matrix - Matches DayWiseStoreSaleScreen) */}
          {activeTab === 'SHOW_ALL' ? (
            <View style={styles.cardsList}>
              <Text style={[styles.listHeaderTitle, { color: theme.textSecondary }]}>
                CONSOLIDATED DAY-WISE BILL COMPARISON MATRIX ({consolidatedDailySales.daysData.length} DATES)
              </Text>

              <View style={[styles.dailyTableBox, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
                <View style={[styles.dailyTableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={[styles.dailyThText, { color: theme.textSecondary }]}>DATE & AUDITED STORES</Text>
                  <Text style={[styles.dailyThText, { color: theme.textSecondary, textAlign: 'right' }]}>STATUS / TOTAL REVENUE</Text>
                </View>

                {consolidatedDailySales.daysData.map((day) => {
                  const isMismatch = day.discrepancyCount > 0;
                  const pctOfMax = consolidatedDailySales.maxDayAmount > 0 ? (day.totalAmount / consolidatedDailySales.maxDayAmount) * 100 : 0;

                  return (
                    <View
                      key={day.dateStr}
                      style={[
                        styles.dailyTableRowBlock,
                        {
                          backgroundColor: isMismatch
                            ? isDark ? '#3f1d1d33' : '#FFF7ED'
                            : isDark ? '#1e293b11' : '#ffffff',
                          borderBottomColor: theme.border,
                        },
                      ]}
                    >
                      {/* Level 1: Main Date, Store count, Badge & Revenue */}
                      <View style={styles.rowLevel1}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.dailyTdDate, { color: theme.textPrimary }]}>
                            {day.dateStr}
                          </Text>
                          <View style={[styles.storeCountTag, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                            <Text style={[styles.storeCountTagText, { color: theme.textSecondary }]}>
                              {day.storeCount} Store{day.storeCount > 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Badge
                            label={isMismatch ? `${day.discrepancyCount} MISMATCH` : 'VERIFIED'}
                            variant={isMismatch ? 'danger' : 'success'}
                          />
                          <Text style={[styles.dailyTdVal, { color: theme.primary }]}>
                            {formatCurrency(day.totalAmount)}
                          </Text>
                        </View>
                      </View>

                      {/* Level 2: 4 Mini Metric Chips (Central, ERP, Desktop App, POS App) */}
                      <View style={styles.rowLevel2Grid}>
                        <View style={[styles.miniChip, { backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe' }]}>
                          <Text style={[styles.miniChipLbl, { color: '#0284c7' }]}>Central</Text>
                          <Text style={[styles.miniChipVal, { color: '#0369a1' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                            {formatNumber(day.centralCount)}
                          </Text>
                        </View>

                        <View style={[styles.miniChip, { backgroundColor: isDark ? '#14382c' : '#dcfce7' }]}>
                          <Text style={[styles.miniChipLbl, { color: '#16a34a' }]}>ERP</Text>
                          <Text style={[styles.miniChipVal, { color: '#15803d' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                            {formatNumber(day.erpCount)}
                          </Text>
                        </View>

                        <View style={[styles.miniChip, { backgroundColor: isDark ? '#2e1065' : '#f3e8ff' }]}>
                          <Text style={[styles.miniChipLbl, { color: '#9333ea' }]}>Desktop</Text>
                          <Text style={[styles.miniChipVal, { color: '#7e22ce' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                            {formatNumber(day.desktopCount)}
                          </Text>
                        </View>

                        <View style={[styles.miniChip, { backgroundColor: isDark ? '#3b0764' : '#faf5ff' }]}>
                          <Text style={[styles.miniChipLbl, { color: '#c084fc' }]}>POS App</Text>
                          <Text style={[styles.miniChipVal, { color: '#9333ea' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                            {formatNumber(day.posCount)}
                          </Text>
                        </View>
                      </View>

                      {/* Revenue Bar indicator */}
                      <View style={{ height: 3, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 1.5, marginTop: 6 }}>
                        <View
                          style={{
                            width: `${Math.min(100, pctOfMax)}%`,
                            height: '100%',
                            backgroundColor: isMismatch ? '#ef4444' : '#2563eb',
                            borderRadius: 1.5,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}

                {/* Total Consolidated Footer Block */}
                <View style={[styles.dailyTableRowBlock, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderBottomWidth: 0, paddingVertical: 12 }]}>
                  <View style={styles.rowLevel1}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: theme.primary }}>
                      TOTAL MTD SUMMARY
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: theme.primary }}>
                      {formatCurrency(consolidatedDailySales.grandTotalAmount)}
                    </Text>
                  </View>

                  <View style={[styles.rowLevel2Grid, { marginTop: 8 }]}>
                    <View style={[styles.miniChip, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                      <Text style={[styles.miniChipLbl, { color: '#1e40af' }]}>Central</Text>
                      <Text style={[styles.miniChipVal, { color: '#1e3a8a' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {formatNumber(consolidatedDailySales.grandTotalCentral)}
                      </Text>
                    </View>

                    <View style={[styles.miniChip, { backgroundColor: isDark ? '#14382c' : '#d1fae5' }]}>
                      <Text style={[styles.miniChipLbl, { color: '#047857' }]}>ERP</Text>
                      <Text style={[styles.miniChipVal, { color: '#065f46' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {formatNumber(consolidatedDailySales.grandTotalErp)}
                      </Text>
                    </View>

                    <View style={[styles.miniChip, { backgroundColor: isDark ? '#2e1065' : '#e9d5ff' }]}>
                      <Text style={[styles.miniChipLbl, { color: '#6b21a8' }]}>Desktop</Text>
                      <Text style={[styles.miniChipVal, { color: '#581c87' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {formatNumber(consolidatedDailySales.grandTotalDesktop)}
                      </Text>
                    </View>

                    <View style={[styles.miniChip, { backgroundColor: isDark ? '#3b0764' : '#f3e8ff' }]}>
                      <Text style={[styles.miniChipLbl, { color: '#7e22ce' }]}>POS App</Text>
                      <Text style={[styles.miniChipVal, { color: '#6b21a8' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {formatNumber(consolidatedDailySales.grandTotalPos)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* TAB 2: STORE WISE MATRIX (Matches DayWiseStoreSaleScreen) */
            <View style={styles.cardsList}>
              <Text style={[styles.listHeaderTitle, { color: theme.textSecondary }]}>
                STORE DAILY BILL COMPARISON MATRIX ({storeWiseMatrix.length} STORES)
              </Text>

              {storeWiseMatrix.map((row, idx) => {
                const isMismatch = row.discrepancyCount > 0;
                const barPct = row.centralCount > 0 ? Math.min(100, (row.erpCount / row.centralCount) * 100) : 100;

                return (
                  <View
                    key={row.branchCode}
                    style={[styles.storeCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  >
                    {/* Store Header Row */}
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.rankIconBox, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
                          <Text style={[styles.rankText, { color: theme.primary }]}>#{idx + 1}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                            {row.branchName}
                          </Text>
                          <Text style={[styles.storeMetaText, { color: theme.textMuted }]} numberOfLines={1}>
                            Code: {row.branchCode} • {row.daysCount} Audited Day(s)
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.achPill, { backgroundColor: isMismatch ? (isDark ? '#3f1d1d' : '#FEF2F2') : (isDark ? '#1e3a5f' : '#ECFDF5') }]}>
                        <Text style={[styles.achPillText, { color: isMismatch ? '#DC2626' : '#059669' }]}>
                          {isMismatch ? `${row.discrepancyCount} MISMATCHES` : 'VERIFIED'}
                        </Text>
                      </View>
                    </View>

                    {/* Sync Accuracy Progress Bar Track */}
                    <View style={{ marginTop: 10, marginBottom: 10 }}>
                      <View style={[styles.barTrack, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${barPct}%`,
                              backgroundColor: isMismatch ? '#ef4444' : '#10b981',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* 2x2 Metrics Grid (Central, ERP, Desktop, POS App) */}
                    <View style={[styles.metricsGrid, { backgroundColor: isDark ? '#1e293b33' : '#f8fafc', borderColor: theme.border }]}>
                      <View style={styles.mCell}>
                        <Text style={[styles.mLbl, { color: theme.textMuted }]}>Central Invoices</Text>
                        <Text style={[styles.mVal, { color: isDark ? '#93c5fd' : '#0284c7' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {formatNumber(row.centralCount)}
                        </Text>
                      </View>
                      <View style={styles.mCell}>
                        <Text style={[styles.mLbl, { color: theme.textMuted }]}>ERP Invoices</Text>
                        <Text style={[styles.mVal, { color: isDark ? '#6ee7b7' : '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {formatNumber(row.erpCount)}
                        </Text>
                      </View>
                      <View style={styles.mCell}>
                        <Text style={[styles.mLbl, { color: theme.textMuted }]}>Desktop Bills</Text>
                        <Text style={[styles.mVal, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {formatNumber(row.desktopCount)}
                        </Text>
                      </View>
                      <View style={styles.mCell}>
                        <Text style={[styles.mLbl, { color: theme.textSecondary }]} numberOfLines={1}>POS App Bills</Text>
                        <Text style={[styles.mVal, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {formatNumber(row.posCount)}
                        </Text>
                      </View>
                    </View>

                    {/* Inner Daily Bill Comparison Table inside Store Card */}
                    <View style={[styles.dailyTableBox, { borderColor: theme.border }]}>
                      <View style={[styles.dailyTableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                        <Text style={[styles.dailyThText, { color: theme.textSecondary }]}>AUDITED DATE</Text>
                        <Text style={[styles.dailyThText, { color: theme.textSecondary, textAlign: 'right' }]}>STATUS / REVENUE</Text>
                      </View>

                      {row.items.map((item, dIdx) => {
                        const centralCount = Number(item.central_count ?? item.total_bills ?? 0);
                        const erpCount = Number(item.erp_count ?? item.pos_bill_count ?? 0);
                        const desktopCount = Number(item.desktop_app_count ?? item.desktop_count ?? item.desktop_app ?? 0);
                        const posCount = Number(item.pos_count ?? item.pos_app_count ?? item.pos_bills ?? 0);
                        const isRowMismatch = centralCount !== erpCount;
                        const dateStr = item.bill_date || item.date || 'N/A';
                        const totalAmount = Number(item.total_amount ?? item.pos_total_amount ?? 0);

                        return (
                          <View
                            key={`${row.branchCode}-${dateStr}-${dIdx}`}
                            style={[
                              styles.dailyTableRowBlock,
                              {
                                backgroundColor: isRowMismatch
                                  ? isDark ? '#3f1d1d33' : '#FFF7ED'
                                  : isDark ? '#1e293b11' : '#ffffff',
                                borderBottomColor: theme.border,
                              },
                            ]}
                          >
                            <View style={styles.rowLevel1}>
                              <Text style={[styles.dailyTdDate, { color: theme.textPrimary }]}>
                                {dateStr}
                              </Text>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Badge
                                  label={isRowMismatch ? 'ERR' : 'OK'}
                                  variant={isRowMismatch ? 'danger' : 'success'}
                                />
                                <Text style={[styles.dailyTdVal, { color: theme.textPrimary }]}>
                                  {formatCurrency(totalAmount)}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.rowLevel2Grid}>
                              <View style={[styles.miniChip, { backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe' }]}>
                                <Text style={[styles.miniChipLbl, { color: '#0284c7' }]}>Central</Text>
                                <Text style={[styles.miniChipVal, { color: '#0369a1' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                  {formatNumber(centralCount)}
                                </Text>
                              </View>

                              <View style={[styles.miniChip, { backgroundColor: isDark ? '#14382c' : '#dcfce7' }]}>
                                <Text style={[styles.miniChipLbl, { color: '#16a34a' }]}>ERP</Text>
                                <Text style={[styles.miniChipVal, { color: '#15803d' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                  {formatNumber(erpCount)}
                                </Text>
                              </View>

                              <View style={[styles.miniChip, { backgroundColor: isDark ? '#2e1065' : '#f3e8ff' }]}>
                                <Text style={[styles.miniChipLbl, { color: '#9333ea' }]}>Desktop</Text>
                                <Text style={[styles.miniChipVal, { color: '#7e22ce' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                  {formatNumber(desktopCount)}
                                </Text>
                              </View>

                              <View style={[styles.miniChip, { backgroundColor: isDark ? '#3b0764' : '#faf5ff' }]}>
                                <Text style={[styles.miniChipLbl, { color: '#c084fc' }]}>POS App</Text>
                                <Text style={[styles.miniChipVal, { color: '#9333ea' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                  {formatNumber(posCount)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Unified Filter Modal */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Bill Comparison Filters"
        selectedPreset={selectedPreset}
        fromDate={fromDate}
        toDate={toDate}
        onClose={closeFilterModal}
        onApplyPreset={applyPreset}
        onSelectDate={(newDate, target) => {
          if (target === 'FROM') setFromDate(newDate);
          else setToDate(newDate);
        }}
        onApply={handleApplyClick}
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

        {/* FY Code Input */}
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Financial Year Code</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <Hash size={13} color={theme.textMuted} style={{ marginRight: 4 }} />
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary }]}
              value={fyCode}
              onChangeText={setFyCode}
              placeholder="20262027"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        {/* Status Filter */}
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Match Status</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              style={[
                styles.presetPillModal,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                statusFilter === 'ALL' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setStatusFilter('ALL')}
            >
              <Text style={[styles.presetTextModal, { color: theme.textSecondary }, statusFilter === 'ALL' && styles.presetTextModalActive]}>All Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.presetPillModal,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                statusFilter === 'MATCHED' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setStatusFilter('MATCHED')}
            >
              <Text style={[styles.presetTextModal, { color: theme.textSecondary }, statusFilter === 'MATCHED' && styles.presetTextModalActive]}>Matched</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.presetPillModal,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                statusFilter === 'DISCREPANCY' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setStatusFilter('DISCREPANCY')}
            >
              <Text style={[styles.presetTextModal, { color: theme.textSecondary }, statusFilter === 'DISCREPANCY' && styles.presetTextModalActive]}>Discrepancies</Text>
            </TouchableOpacity>
          </View>
        </View>
      </UnifiedFilterModal>

      {/* Standalone Branch Selector Modal */}
      <BranchSelectorModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        selectedBranchCodes={selectedBranchCodes}
        onApply={(newCodes) => {
          setSelectedBranchCodes(newCodes);
        }}
        title="Select Stores to Audit"
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={activePickerTarget !== null}
        onClose={() => setActivePickerTarget(null)}
        value={activePickerTarget === 'FROM' ? fromDate : toDate}
        title={activePickerTarget === 'FROM' ? 'Select From Date' : 'Select To Date'}
        onSelectDate={(newDate: string) => {
          if (activePickerTarget === 'FROM') {
            setFromDate(newDate);
          } else {
            setToDate(newDate);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  controlBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, fontSize: 11.5, paddingVertical: 0 },

  // KPI Cards
  kpiWrap: { flexDirection: 'row', gap: 6 },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },
  iconWrap: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  kLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.2 },
  kValue: { fontSize: 11.5, fontWeight: '900', marginTop: 0 },

  // Cards List
  cardsList: { paddingHorizontal: 12, gap: 12 },
  listHeaderTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  storeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
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

  // Representable Daily Table Box
  dailyTableBox: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  dailyTableHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'space-between' },
  dailyThText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4 },
  dailyTableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  dailyTableRowBlock: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowLevel1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeCountTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storeCountTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  rowLevel2Grid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  miniChip: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  miniChipLbl: {
    fontSize: 7.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  miniChipVal: {
    fontSize: 10.5,
    fontWeight: '900',
    marginTop: 1,
  },
  dailyTdDate: { fontSize: 11, fontWeight: '800' },
  dailyTdVal: { fontSize: 11.5, fontWeight: '900' },

  centerContainer: {
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
  errorBox: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 4,
  },
  errorSub: {
    fontSize: 12,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
  },
  presetPillModal: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetTextModal: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetTextModalActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
