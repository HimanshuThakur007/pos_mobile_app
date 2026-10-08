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
import { BranchHourlySalesVisualChart } from '../components/widgets/BranchHourlySalesVisualChart';
import {
  fetchBranchHourlySales,
  BranchHourlySalesItem,
  BranchHourlySalesTotals,
} from '../api/branchHourlySalesApi';
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
  CreditCard,
  Receipt,
  BarChart3,
  BarChart2,
  LayoutList,
  Clock,
  Zap,
  ArrowDownRight,
  ShoppingBag,
} from 'lucide-react-native';

const INITIAL_PAGE_SIZE = 25;

type SortOption = 'HOUR' | 'NET_SALES' | 'GROSS_SALES' | 'RETURNS' | 'BILLS';
type ViewMode = 'LIST' | 'CHARTS';
type GroupTab = 'ALL' | 'BY_HOUR' | 'BY_STORE';

export const BranchWiseHourlySalesScreen: React.FC<{ navigation?: any }> = () => {
  const { width } = useWindowDimensions();
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

  // Default View Mode: 'LIST'
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [activeGroupTab, setActiveGroupTab] = useState<GroupTab>('ALL');

  // Branch Selection State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Search & Sorting State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('HOUR');
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE);

  // Data state (No hardcoded default mock data)
  const [records, setRecords] = useState<BranchHourlySalesItem[]>([]);
  const [totals, setTotals] = useState<BranchHourlySalesTotals | null>(null);
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

      const res = await fetchBranchHourlySales({
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
        setErrorMessage(res.error || 'Failed to fetch store hourly sales data.');
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
    setSortBy('HOUR');
    loadData('2026-08-01', '2026-09-16', ['5080', '5047', '5003', '5010']);
  };

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.branch_name.toLowerCase().includes(q) ||
          r.branch_code.toLowerCase().includes(q) ||
          r.hour_label.toLowerCase().includes(q) ||
          String(r.hour).includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'NET_SALES') return b.net_sales - a.net_sales;
      if (sortBy === 'GROSS_SALES') return b.sales_amount - a.sales_amount;
      if (sortBy === 'RETURNS') return b.return_amount - a.return_amount;
      if (sortBy === 'BILLS') return b.bill_count - a.bill_count;
      return a.hour - b.hour;
    });

    return list;
  }, [records, searchQuery, sortBy]);

  // Grouped by Hour Summary
  const groupedByHour = useMemo(() => {
    const map: Record<string, { hour: number; hour_label: string; bill_count: number; sales_amount: number; return_amount: number; net_sales: number; store_count: number }> = {};

    filteredRecords.forEach((r) => {
      const key = r.hour_label || `${r.hour}:00`;
      if (!map[key]) {
        map[key] = {
          hour: r.hour,
          hour_label: key,
          bill_count: 0,
          sales_amount: 0,
          return_amount: 0,
          net_sales: 0,
          store_count: 0,
        };
      }
      map[key].bill_count += r.bill_count;
      map[key].sales_amount += r.sales_amount;
      map[key].return_amount += r.return_amount;
      map[key].net_sales += r.net_sales;
      map[key].store_count += 1;
    });

    return Object.values(map).sort((a, b) => a.hour - b.hour);
  }, [filteredRecords]);

  // Grouped by Store Summary
  const groupedByStore = useMemo(() => {
    const map: Record<string, { branch_code: string; branch_name: string; bill_count: number; sales_amount: number; return_amount: number; net_sales: number; hours_count: number }> = {};

    filteredRecords.forEach((r) => {
      if (!map[r.branch_code]) {
        map[r.branch_code] = {
          branch_code: r.branch_code,
          branch_name: r.branch_name,
          bill_count: 0,
          sales_amount: 0,
          return_amount: 0,
          net_sales: 0,
          hours_count: 0,
        };
      }
      map[r.branch_code].bill_count += r.bill_count;
      map[r.branch_code].sales_amount += r.sales_amount;
      map[r.branch_code].return_amount += r.return_amount;
      map[r.branch_code].net_sales += r.net_sales;
      map[r.branch_code].hours_count += 1;
    });

    return Object.values(map).sort((a, b) => b.net_sales - a.net_sales);
  }, [filteredRecords]);

  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, displayLimit);
  }, [filteredRecords, displayLimit]);

  // Computed Executive KPI Stats
  const kpiStats = useMemo(() => {
    if (totals) {
      return {
        totalNetSales: totals.total_net_sales,
        totalSalesAmount: totals.total_sales_amount,
        totalReturnAmount: totals.total_return_amount,
        totalBillCount: totals.total_bill_count,
        peakHourLabel: totals.peak_hour_label,
        peakHourNetSales: totals.peak_hour_net_sales,
      };
    }

    let net = 0;
    let gross = 0;
    let ret = 0;
    let bills = 0;
    const hourMap: Record<string, number> = {};

    records.forEach((r) => {
      net += r.net_sales;
      gross += r.sales_amount;
      ret += r.return_amount;
      bills += r.bill_count;

      const label = r.hour_label || `${r.hour}:00`;
      hourMap[label] = (hourMap[label] || 0) + r.net_sales;
    });

    let peakLabel = 'None';
    let peakSales = 0;
    Object.entries(hourMap).forEach(([lbl, v]) => {
      if (v > peakSales) {
        peakSales = v;
        peakLabel = lbl;
      }
    });

    return {
      totalNetSales: net,
      totalSalesAmount: gross,
      totalReturnAmount: ret,
      totalBillCount: bills,
      peakHourLabel: peakLabel,
      peakHourNetSales: peakSales,
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
          {/* Card 1: Total Net Sales */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]} numberOfLines={1}>TOTAL NET SALES</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#1e3a8a33' : '#dbeafe' }]}>
                <TrendingUp size={16} color={theme.primary} />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: theme.textPrimary }]}>{formatCurrency(kpiStats.totalNetSales)}</Text>
            <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
              Across {selectedBranchCodes.length} store(s)
            </Text>
          </View>

          {/* Card 2: Peak Hourly Velocity */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]} numberOfLines={1}>PEAK HOURLY SLOT</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#581c8733' : '#f3e8ff' }]}>
                <Zap size={16} color="#9333ea" />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: isDark ? '#c084fc' : '#7e22ce' }]}>
              {kpiStats.peakHourLabel}
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
              Sales: {formatCurrency(kpiStats.peakHourNetSales)}
            </Text>
          </View>

          {/* Card 3: Gross Sales */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]} numberOfLines={1}>GROSS SALES</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#064e3b33' : '#d1fae5' }]}>
                <ShoppingBag size={16} color="#10b981" />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: isDark ? '#34d399' : '#059669' }]}>
              {formatCurrency(kpiStats.totalSalesAmount)}
            </Text>
            <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
              {formatNumber(kpiStats.totalBillCount)} Total Bills
            </Text>
          </View>

          {/* Card 4: Total Returns */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]} numberOfLines={1}>RETURN AMOUNT</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#7f1d1d33' : '#fee2e2' }]}>
                <ArrowDownRight size={16} color="#ef4444" />
              </View>
            </View>
            <Text style={[styles.kpiVal, { color: '#ef4444' }]}>{formatCurrency(kpiStats.totalReturnAmount)}</Text>
            <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>Sales returns</Text>
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
                Hourly List
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
          <BranchHourlySalesVisualChart records={records} totals={kpiStats as any} />
        ) : (
          <>
            {/* GROUPING SUB-TABS (ALL | BY HOUR | BY STORE) */}
            <View style={styles.groupTabRow}>
              <TouchableOpacity
                style={[
                  styles.groupSubTab,
                  { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                  activeGroupTab === 'ALL' && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setActiveGroupTab('ALL')}
              >
                <Text style={[styles.groupSubTabText, { color: activeGroupTab === 'ALL' ? '#ffffff' : theme.textSecondary }]}>
                  All Slots ({filteredRecords.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.groupSubTab,
                  { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                  activeGroupTab === 'BY_HOUR' && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setActiveGroupTab('BY_HOUR')}
              >
                <Text style={[styles.groupSubTabText, { color: activeGroupTab === 'BY_HOUR' ? '#ffffff' : theme.textSecondary }]}>
                  By Hour Slot ({groupedByHour.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.groupSubTab,
                  { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                  activeGroupTab === 'BY_STORE' && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setActiveGroupTab('BY_STORE')}
              >
                <Text style={[styles.groupSubTabText, { color: activeGroupTab === 'BY_STORE' ? '#ffffff' : theme.textSecondary }]}>
                  By Store ({groupedByStore.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={[styles.searchRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Search size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search by store name, branch code, or hour..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </>
        )}
      </View>
    );
  };

  // Render Item for Hourly Slot Records
  const renderHourlyItem = ({ item, index }: { item: BranchHourlySalesItem; index: number }) => {
    const isPeak = item.hour_label === kpiStats.peakHourLabel;

    return (
      <View
        style={[
          styles.recordCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isPeak && { borderColor: theme.primary, borderWidth: 1.5 },
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.branchNameText, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.branch_name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <Badge label={`Code ${item.branch_code}`} variant="info" />
              {isPeak && <Badge label="PEAK" variant="warning" />}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 2 }}>
                <Clock size={12} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.dateText, { color: theme.primary, fontWeight: '700' }]}>
                  Slot: {item.hour_label}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <Text style={[styles.netSalesText, { color: theme.primary }]}>
              {formatCurrency(item.net_sales)}
            </Text>
            <Text style={[styles.billCountText, { color: theme.textMuted }]}>
              {formatNumber(item.bill_count)} Bills
            </Text>
          </View>
        </View>

        {/* Breakdown Row */}
        <View style={[styles.cardFooterRow, { borderTopColor: theme.divider }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
              Gross: <Text style={[styles.breakdownBold, { color: theme.textPrimary }]}>{formatCurrency(item.sales_amount)}</Text>
            </Text>
            <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
              Return: <Text style={[styles.breakdownBold, { color: item.return_amount > 0 ? '#ef4444' : theme.textSecondary }]}>{formatCurrency(item.return_amount)}</Text>
            </Text>
          </View>

          <Text style={[styles.aovText, { color: theme.textSecondary }]}>
            Avg: {formatCurrency(item.bill_count > 0 ? item.net_sales / item.bill_count : 0)}/bill
          </Text>
        </View>
      </View>
    );
  };

  // Render Hour Group Item
  const renderHourGroupItem = ({ item }: { item: any }) => {
    const isPeak = item.hour_label === kpiStats.peakHourLabel;

    return (
      <View
        style={[
          styles.recordCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isPeak && { borderColor: theme.primary, borderWidth: 1.5 },
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Clock size={14} color={theme.primary} />
              <Text style={[styles.branchNameText, { color: theme.textPrimary }]}>{item.hour_label}</Text>
              {isPeak && <Badge label="PEAK SLOT" variant="warning" />}
            </View>
            <Text style={[styles.dateText, { color: theme.textSecondary, marginTop: 4 }]}>
              Aggregated across {item.store_count} store(s)
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <Text style={[styles.netSalesText, { color: theme.primary }]}>{formatCurrency(item.net_sales)}</Text>
            <Text style={[styles.billCountText, { color: theme.textMuted }]}>{formatNumber(item.bill_count)} Bills</Text>
          </View>
        </View>

        <View style={[styles.cardFooterRow, { borderTopColor: theme.divider }]}>
          <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
            Gross: <Text style={[styles.breakdownBold, { color: theme.textPrimary }]}>{formatCurrency(item.sales_amount)}</Text>
          </Text>
          <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
            Returns: <Text style={[styles.breakdownBold, { color: '#ef4444' }]}>{formatCurrency(item.return_amount)}</Text>
          </Text>
        </View>
      </View>
    );
  };

  // Render Store Group Item
  const renderStoreGroupItem = ({ item }: { item: any }) => (
    <View style={[styles.recordCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.branchNameText, { color: theme.textPrimary }]} numberOfLines={1}>{item.branch_name}</Text>
          <Text style={[styles.dateText, { color: theme.textSecondary, marginTop: 2 }]}>
            Code: {item.branch_code} • {item.hours_count} hourly slot(s)
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <Text style={[styles.netSalesText, { color: theme.primary }]}>{formatCurrency(item.net_sales)}</Text>
          <Text style={[styles.billCountText, { color: theme.textMuted }]}>{formatNumber(item.bill_count)} Total Bills</Text>
        </View>
      </View>

      <View style={[styles.cardFooterRow, { borderTopColor: theme.divider }]}>
        <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
          Gross: <Text style={[styles.breakdownBold, { color: theme.textPrimary }]}>{formatCurrency(item.sales_amount)}</Text>
        </Text>
        <Text style={[styles.breakdownText, { color: theme.textMuted }]}>
          Returns: <Text style={[styles.breakdownBold, { color: '#ef4444' }]}>{formatCurrency(item.return_amount)}</Text>
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Branch Hourly Sales"
        subtitle={`Live API • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {isLoading && records.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Fetching store hourly sales data...
          </Text>
        </View>
      ) : (
        <FlatList<any>
          data={
            viewMode === 'CHARTS'
              ? []
              : activeGroupTab === 'BY_HOUR'
              ? groupedByHour
              : activeGroupTab === 'BY_STORE'
              ? groupedByStore
              : visibleRecords
          }
          keyExtractor={(item, index) =>
            activeGroupTab === 'BY_HOUR'
              ? item.hour_label
              : activeGroupTab === 'BY_STORE'
              ? item.branch_code
              : item.branch_code + '-' + item.hour_label + '-' + index
          }
          renderItem={
            activeGroupTab === 'BY_HOUR'
              ? (renderHourGroupItem as any)
              : activeGroupTab === 'BY_STORE'
              ? (renderStoreGroupItem as any)
              : (renderHourlyItem as any)
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            viewMode === 'LIST' ? (
              <View style={styles.emptyBox}>
                <Clock size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Hourly Sales Records Found</Text>
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
          initialNumToRender={20}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* UNIFIED FILTER MODAL — Rendered at Root level outside FlatList */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Hourly Sales Filters"
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
        title="Select Branches for Hourly Sales"
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
    padding: 14,
    paddingBottom: 140,
    gap: 10,
  },
  listHeaderContainer: {
    gap: 12,
    marginBottom: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
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
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 145,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
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
    marginTop: 6,
  },
  kpiSub: {
    fontSize: 10,
    marginTop: 2,
  },
  viewModeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
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
    marginTop: 4,
  },
  groupSubTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
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
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  recordCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  branchNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
  },
  netSalesText: {
    fontSize: 15,
    fontWeight: '800',
  },
  billCountText: {
    fontSize: 10,
    marginTop: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
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
});
