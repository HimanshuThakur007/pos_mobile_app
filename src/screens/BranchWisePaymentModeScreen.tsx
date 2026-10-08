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
  fetchBranchPaymentModes,
  BranchPaymentModeItem,
  BranchPaymentModeTotals,
} from '../api/branchPaymentModeApi';
import { fetchBranches, BranchItem } from '../api/comparisonApi';
import { formatDateToYYYYMMDD, formatCurrency, formatNumber, getStoreFilterLabel } from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BranchPaymentModeVisualChart } from '../components/widgets/BranchPaymentModeVisualChart';
import {
  TrendingUp,
  Search,
  Building2,
  AlertTriangle,
  ChevronDown,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  Trophy,
  Layers,
  PieChart,
  List,
  BarChart3,
  X,
  Store,
  ChevronRight,
  Info,
} from 'lucide-react-native';

const INITIAL_PAGE_SIZE = 30;

type ViewMode = 'LIST' | 'SUMMARY' | 'CHART';
type ModeCategory = 'ALL' | 'CASH' | 'CARD' | 'UPI' | 'OTHER';

export const BranchWisePaymentModeScreen: React.FC<{ navigation?: any }> = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
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

  // View Mode & Filtering States
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [activeModeFilter, setActiveModeFilter] = useState<ModeCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE);

  // Branch Selection State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Detail Modal State
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Data state
  const [records, setRecords] = useState<BranchPaymentModeItem[]>([]);
  const [totals, setTotals] = useState<BranchPaymentModeTotals | null>(null);
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

      const res = await fetchBranchPaymentModes({
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
        setErrorMessage(res.error || 'Failed to fetch store payment mode split data.');
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

  // Filtered Raw Records (Sorted by amount descending by default)
  const filteredRecords = useMemo(() => {
    let list = [...records];

    // Mode filter
    if (activeModeFilter !== 'ALL') {
      list = list.filter((r) => {
        const m = r.mode.toLowerCase();
        if (activeModeFilter === 'CASH') return m.includes('cash');
        if (activeModeFilter === 'CARD') return m.includes('card');
        if (activeModeFilter === 'UPI') return m.includes('upi') || m.includes('qr') || m.includes('online') || m.includes('paytm');
        if (activeModeFilter === 'OTHER') return !m.includes('cash') && !m.includes('card') && !m.includes('upi') && !m.includes('qr') && !m.includes('online');
        return true;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.branch_name.toLowerCase().includes(q) ||
          r.branch_code.toLowerCase().includes(q) ||
          r.mode.toLowerCase().includes(q)
      );
    }

    // Default Sort by Amount descending
    list.sort((a, b) => b.amount - a.amount);

    return list;
  }, [records, activeModeFilter, searchQuery]);

  // Visible records slice
  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, displayLimit);
  }, [filteredRecords, displayLimit]);

  // Aggregated Summary By Payment Mode
  const aggregatedModeSummaries = useMemo(() => {
    const map: Record<
      string,
      {
        mode: string;
        totalAmount: number;
        totalTxns: number;
        storeSet: Set<string>;
        stores: { branch_code: string; branch_name: string; amount: number; txn_count: number }[];
      }
    > = {};

    records.forEach((r) => {
      const key = r.mode.toUpperCase();
      if (!map[key]) {
        map[key] = {
          mode: key,
          totalAmount: 0,
          totalTxns: 0,
          storeSet: new Set(),
          stores: [],
        };
      }
      map[key].totalAmount += r.amount;
      map[key].totalTxns += r.txn_count;
      map[key].storeSet.add(r.branch_code);
      map[key].stores.push({
        branch_code: r.branch_code,
        branch_name: r.branch_name,
        amount: r.amount,
        txn_count: r.txn_count,
      });
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        storeCount: item.storeSet.size,
        stores: item.stores.sort((a, b) => b.amount - a.amount),
        avgTxn: item.totalTxns > 0 ? item.totalAmount / item.totalTxns : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [records]);

  // Computed Executive KPI Stats
  const kpiStats = useMemo(() => {
    if (totals) {
      const avgTxn = totals.total_txns > 0 ? totals.total_amount / totals.total_txns : 0;
      return {
        totalAmount: totals.total_amount,
        totalTxns: totals.total_txns,
        topMode: totals.top_mode || 'None',
        topModeAmount: totals.top_mode_amount || 0,
        avgTxnValue: avgTxn,
      };
    }

    let totAmt = 0;
    let totTxns = 0;
    const modeMap: Record<string, number> = {};

    records.forEach((r) => {
      totAmt += r.amount;
      totTxns += r.txn_count;

      const m = r.mode.toUpperCase();
      modeMap[m] = (modeMap[m] || 0) + r.amount;
    });

    let topM = 'None';
    let topA = 0;
    Object.entries(modeMap).forEach(([m, a]) => {
      if (a > topA) {
        topA = a;
        topM = m;
      }
    });

    const avgTxn = totTxns > 0 ? totAmt / totTxns : 0;

    return {
      totalAmount: totAmt,
      totalTxns: totTxns,
      topMode: topM,
      topModeAmount: topA,
      avgTxnValue: avgTxn,
    };
  }, [records, totals]);

  // Max Amount for relative progress bar calculation
  const maxRecordAmount = useMemo(() => {
    if (records.length === 0) return 1;
    return Math.max(...records.map((r) => r.amount), 1);
  }, [records]);

  const maxModeSummaryAmount = useMemo(() => {
    if (aggregatedModeSummaries.length === 0) return 1;
    return Math.max(...aggregatedModeSummaries.map((s) => s.totalAmount), 1);
  }, [aggregatedModeSummaries]);

  // Icon Helper with Theme Color Palette
  const getModeTheme = (modeStr: string) => {
    const m = modeStr.toLowerCase();
    if (m.includes('cash')) {
      return {
        icon: <Banknote size={15} color="#16a34a" />,
        badgeBg: isDark ? '#14532d33' : '#dcfce7',
        textColor: '#16a34a',
        barColor: '#16a34a',
      };
    }
    if (m.includes('card')) {
      return {
        icon: <CreditCard size={15} color="#2563eb" />,
        badgeBg: isDark ? '#1e3a8a33' : '#dbeafe',
        textColor: '#2563eb',
        barColor: '#2563eb',
      };
    }
    if (m.includes('upi') || m.includes('qr') || m.includes('online') || m.includes('paytm')) {
      return {
        icon: <QrCode size={15} color="#9333ea" />,
        badgeBg: isDark ? '#581c8733' : '#f3e8ff',
        textColor: '#9333ea',
        barColor: '#9333ea',
      };
    }
    return {
      icon: <ShieldCheck size={15} color={theme.textSecondary} />,
      badgeBg: theme.subtleBoxBg,
      textColor: theme.textSecondary,
      barColor: '#eab308',
    };
  };

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

        {/* Error Warning Banner if offline/failed */}
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
          {/* Card 1: Total Collections */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <TrendingUp size={11} color={theme.primary} />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>COLLECTIONS</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatCurrency(kpiStats.totalAmount)}
            </Text>
          </View>

          {/* Card 2: Top Payment Channel */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Trophy size={11} color="#ca8a04" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>TOP CHANNEL</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#fde047' : '#a16207' }]} numberOfLines={1}>
              {kpiStats.topMode}
            </Text>
          </View>

          {/* Card 3: Total Transactions */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <CreditCard size={11} color="#10b981" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>TRANSACTIONS</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#34d399' : '#059669' }]} numberOfLines={1}>
              {formatNumber(kpiStats.totalTxns)} Txns
            </Text>
          </View>

          {/* Card 4: Avg Ticket Size */}
          <View style={[styles.kpiStripCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.kpiStripHeader}>
              <Layers size={11} color="#9333ea" />
              <Text style={[styles.kpiStripLabel, { color: theme.textSecondary }]}>AVG TICKET</Text>
            </View>
            <Text style={[styles.kpiStripVal, { color: isDark ? '#c084fc' : '#7e22ce' }]} numberOfLines={1}>
              {formatCurrency(kpiStats.avgTxnValue)}
            </Text>
          </View>
        </ScrollView>

        {/* SINGLE Streamlined View Switcher Bar */}
        <View style={[styles.singleViewModeBar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.singleTabBtn,
              viewMode === 'LIST' && [styles.activeSingleTabBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }],
            ]}
            onPress={() => setViewMode('LIST')}
          >
            <List size={13} color={viewMode === 'LIST' ? theme.primary : theme.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.singleTabText, { color: viewMode === 'LIST' ? theme.primary : theme.textMuted }]}>
              Store Records
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.singleTabBtn,
              viewMode === 'SUMMARY' && [styles.activeSingleTabBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }],
            ]}
            onPress={() => setViewMode('SUMMARY')}
          >
            <PieChart size={13} color={viewMode === 'SUMMARY' ? theme.primary : theme.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.singleTabText, { color: viewMode === 'SUMMARY' ? theme.primary : theme.textMuted }]}>
              Mode Summary
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
              Analytics Chart
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Mode Category Filters (Visible in LIST view) */}
        {viewMode === 'LIST' && (
          <View style={styles.searchCatRow}>
            {/* Mode Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeChipsScroll}>
              {(['ALL', 'CASH', 'CARD', 'UPI', 'OTHER'] as ModeCategory[]).map((cat) => {
                const isActive = activeModeFilter === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modeFilterChip,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setActiveModeFilter(cat)}
                  >
                    <Text style={[styles.modeFilterChipText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                      {cat === 'ALL' ? 'All Modes' : cat === 'UPI' ? 'UPI / QR' : cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search Box */}
            <View style={[styles.searchBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Search size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search store, code or mode..."
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
          </View>
        )}
      </View>
    );
  };

  // Render Item for Raw Payment Records (LIST View)
  const renderPaymentItem = ({ item, index }: { item: BranchPaymentModeItem; index: number }) => {
    const isTopMode = item.mode.toUpperCase() === kpiStats.topMode;
    const sharePct = kpiStats.totalAmount > 0 ? (item.amount / kpiStats.totalAmount) * 100 : 0;
    const barPct = maxRecordAmount > 0 ? Math.min(100, Math.max(5, (item.amount / maxRecordAmount) * 100)) : 0;
    const themeStyle = getModeTheme(item.mode);
    const avgTicket = item.txn_count > 0 ? item.amount / item.txn_count : 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleOpenDetailModal({ type: 'ITEM', data: item })}
        style={[
          styles.recordCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          isTopMode && { borderColor: '#ca8a04', borderWidth: 1.5 },
        ]}
      >
        {/* Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.rankIconBox, { backgroundColor: themeStyle.badgeBg }]}>
              {themeStyle.icon}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.branch_name || `Store #${item.branch_code}`}
              </Text>
              <Text style={[styles.storeMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                Code: {item.branch_code} • {item.mode.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={[styles.achPill, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]}>
            <Text style={[styles.achPillText, { color: theme.primary }]}>
              {sharePct.toFixed(1)}% Share
            </Text>
          </View>
        </View>

        {/* Collection Bar Track */}
        <View style={{ marginTop: 10, marginBottom: 10 }}>
          <View style={[styles.barTrack, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${barPct}%`,
                  backgroundColor: themeStyle.barColor,
                },
              ]}
            />
          </View>
        </View>

        {/* 2x2 Metrics Grid */}
        <View style={[styles.metricsGrid, { backgroundColor: isDark ? '#1e293b33' : '#f8fafc', borderColor: theme.border }]}>
          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textSecondary }]}>COLLECTIONS</Text>
            <Text style={[styles.mVal, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(item.amount)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textSecondary }]}>TRANSACTIONS</Text>
            <Text style={[styles.mVal, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatNumber(item.txn_count)} Txns
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textSecondary }]}>AVG TICKET SIZE</Text>
            <Text style={[styles.mVal, { color: '#10b981' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatCurrency(avgTicket)}
            </Text>
          </View>

          <View style={styles.mCell}>
            <Text style={[styles.mLbl, { color: theme.textSecondary }]}>PAYMENT CHANNEL</Text>
            <Text style={[styles.mVal, { color: themeStyle.textColor }]} numberOfLines={1}>
              {item.mode.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Aggregated Summary Cards (SUMMARY View)
  const renderSummaryCards = () => {
    if (aggregatedModeSummaries.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <CreditCard size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Payment Mode Summary Available</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Try selecting different branches or date range in the top filters.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ gap: 10, marginTop: 4 }}>
        {aggregatedModeSummaries.map((summary, idx) => {
          const sharePct = kpiStats.totalAmount > 0 ? (summary.totalAmount / kpiStats.totalAmount) * 100 : 0;
          const barPct = maxModeSummaryAmount > 0 ? Math.min(100, Math.max(6, (summary.totalAmount / maxModeSummaryAmount) * 100)) : 0;
          const themeStyle = getModeTheme(summary.mode);
          const isTopRank = idx === 0;

          return (
            <TouchableOpacity
              key={`${summary.mode}-${idx}`}
              activeOpacity={0.8}
              onPress={() => handleOpenDetailModal({ type: 'SUMMARY', data: summary })}
              style={[
                styles.recordCard,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
                isTopRank && { borderColor: '#ca8a04', borderWidth: 1.5 },
              ]}
            >
              {/* Header Row */}
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.rankIconBox, { backgroundColor: themeStyle.badgeBg }]}>
                    {themeStyle.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {summary.mode.toUpperCase()}
                    </Text>
                    <Text style={[styles.storeMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {summary.storeCount} Store(s) Reporting
                    </Text>
                  </View>
                </View>

                <View style={[styles.achPill, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]}>
                  <Text style={[styles.achPillText, { color: theme.primary }]}>
                    {sharePct.toFixed(1)}% Share
                  </Text>
                </View>
              </View>

              {/* Progress Bar Track */}
              <View style={{ marginTop: 10, marginBottom: 10 }}>
                <View style={[styles.barTrack, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${barPct}%`,
                        backgroundColor: themeStyle.barColor,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* 2x2 Metrics Grid */}
              <View style={[styles.metricsGrid, { backgroundColor: isDark ? '#1e293b33' : '#f8fafc', borderColor: theme.border }]}>
                <View style={styles.mCell}>
                  <Text style={[styles.mLbl, { color: theme.textSecondary }]}>TOTAL COLLECTION</Text>
                  <Text style={[styles.mVal, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                    {formatCurrency(summary.totalAmount)}
                  </Text>
                </View>

                <View style={styles.mCell}>
                  <Text style={[styles.mLbl, { color: theme.textSecondary }]}>TOTAL TRANSACTIONS</Text>
                  <Text style={[styles.mVal, { color: theme.textPrimary }]} numberOfLines={1}>
                    {formatNumber(summary.totalTxns)} Txns
                  </Text>
                </View>

                <View style={styles.mCell}>
                  <Text style={[styles.mLbl, { color: theme.textSecondary }]}>AVG TICKET SIZE</Text>
                  <Text style={[styles.mVal, { color: '#10b981' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                    {formatCurrency(summary.avgTxn)}
                  </Text>
                </View>

                <View style={styles.mCell}>
                  <Text style={[styles.mLbl, { color: theme.textSecondary }]}>CHANNEL RANK</Text>
                  <Text style={[styles.mVal, { color: isTopRank ? '#ca8a04' : theme.textSecondary }]} numberOfLines={1}>
                    #{idx + 1} {isTopRank ? 'Top Channel' : ''}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Branch Payment Modes"
        subtitle={`Live API • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {isLoading && records.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Fetching store payment mode split data...
          </Text>
        </View>
      ) : (
        <FlatList<any>
          data={viewMode === 'LIST' ? visibleRecords : [1]}
          keyExtractor={(item, index) =>
            viewMode === 'LIST' ? `${item.branch_code}-${item.mode}-${index}` : `view-${viewMode}`
          }
          renderItem={
            viewMode === 'LIST'
              ? (renderPaymentItem as any)
              : viewMode === 'SUMMARY'
              ? renderSummaryCards
              : () => (
                  <View style={{ marginTop: 8 }}>
                    {totals && <BranchPaymentModeVisualChart records={records} totals={totals} />}
                  </View>
                )
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            viewMode === 'LIST' ? (
              <View style={styles.emptyBox}>
                <CreditCard size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Payment Records Found</Text>
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
                  {selectedDetailItem?.type === 'SUMMARY'
                    ? `${selectedDetailItem.data.mode} Breakdown`
                    : `${selectedDetailItem?.data?.branch_name} (${selectedDetailItem?.data?.mode?.toUpperCase()})`}
                </Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Payment Channel Performance & Breakdown
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsDetailModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedDetailItem?.type === 'SUMMARY' && (
                <View style={{ gap: 14 }}>
                  {/* Summary Metric Header Grid */}
                  <View style={styles.modalKpiRow}>
                    <View style={[styles.modalKpiCard, { backgroundColor: theme.subtleBoxBg }]}>
                      <Text style={[styles.modalKpiLabel, { color: theme.textMuted }]}>TOTAL AMOUNT</Text>
                      <Text style={[styles.modalKpiVal, { color: theme.primary }]}>
                        {formatCurrency(selectedDetailItem.data.totalAmount)}
                      </Text>
                    </View>

                    <View style={[styles.modalKpiCard, { backgroundColor: theme.subtleBoxBg }]}>
                      <Text style={[styles.modalKpiLabel, { color: theme.textMuted }]}>TRANSACTIONS</Text>
                      <Text style={[styles.modalKpiVal, { color: theme.textPrimary }]}>
                        {formatNumber(selectedDetailItem.data.totalTxns)}
                      </Text>
                    </View>

                    <View style={[styles.modalKpiCard, { backgroundColor: theme.subtleBoxBg }]}>
                      <Text style={[styles.modalKpiLabel, { color: theme.textMuted }]}>AVG TICKET</Text>
                      <Text style={[styles.modalKpiVal, { color: '#10b981' }]}>
                        {formatCurrency(selectedDetailItem.data.avgTxn)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.modalSectionHeader, { color: theme.textPrimary }]}>
                    Store Breakdown for {selectedDetailItem.data.mode}
                  </Text>

                  {/* Stores List */}
                  <View style={{ gap: 8 }}>
                    {selectedDetailItem.data.stores.map((s: any, idx: number) => {
                      const stShare = selectedDetailItem.data.totalAmount > 0
                        ? (s.amount / selectedDetailItem.data.totalAmount) * 100
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
                              Code: {s.branch_code} • {s.txn_count} Txns
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.modalStoreAmt, { color: theme.textPrimary }]}>
                              {formatCurrency(s.amount)}
                            </Text>
                            <Text style={[styles.modalStoreShare, { color: theme.primary }]}>
                              {stShare.toFixed(1)}% share
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {selectedDetailItem?.type === 'ITEM' && (
                <View style={{ gap: 14 }}>
                  <View style={[styles.modalItemCard, { backgroundColor: theme.subtleBoxBg }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted }}>STORE</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>
                        {selectedDetailItem.data.branch_name}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted }}>PAYMENT MODE</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.primary }}>
                        {selectedDetailItem.data.mode.toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted }}>AMOUNT COLLECTED</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                        {formatCurrency(selectedDetailItem.data.amount)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted }}>TXN COUNT</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary }}>
                        {formatNumber(selectedDetailItem.data.txn_count)} Transactions
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted }}>AVERAGE TICKET</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#10b981' }}>
                        {formatCurrency(
                          selectedDetailItem.data.txn_count > 0
                            ? selectedDetailItem.data.amount / selectedDetailItem.data.txn_count
                            : 0
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* UNIFIED FILTER MODAL — Rendered at Root level outside FlatList */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Payment Modes Filters"
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
        title="Select Branches for Payment Modes"
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
  searchCatRow: {
    gap: 6,
  },
  modeChipsScroll: {
    gap: 6,
    paddingVertical: 1,
  },
  modeFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  modeFilterChipText: {
    fontSize: 10.5,
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

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderRadius: 10, borderWidth: 1 },
  mCell: { width: '50%', padding: 4 },
  mLbl: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4 },
  mVal: { fontSize: 11.5, fontWeight: '800', marginTop: 1.5 },
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
  modalItemCard: {
    padding: 14,
    borderRadius: 12,
  },
});
