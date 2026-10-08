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
  Alert,
  FlatList,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { DatePickerModal } from '../components/modals/DatePickerModal';
import { BranchSelectorModal } from '../components/modals/BranchSelectorModal';
import { UnifiedTopFilterBar } from '../components/common/UnifiedTopFilterBar';
import { UnifiedFilterModal } from '../components/common/UnifiedFilterModal';
import { StoreSelectionTriggerBadge } from '../components/common/StoreSelectionTriggerBadge';
import { useGlobalFilter, DatePreset } from '../context/GlobalFilterContext';
import { Badge } from '../components/Badge';
import {
  fetchErpPosComparison,
  ErpPosComparisonItem,
  ErpPosSummary,
} from '../api/comparisonApi';
import { fetchBranches, BranchItem } from '../api/comparisonApi';
import { formatDateToYYYYMMDD, formatCurrency, formatNumber, getStoreFilterLabel } from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  X,
  Calendar,
  ChevronDown,
  FileQuestion,
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft,
  GitCompare,
} from 'lucide-react-native';

const INITIAL_PAGE_SIZE = 15;

type FilterCategory = 'ALL' | 'MATCHED' | 'MISMATCHED' | 'MISSING_IN_ERP' | 'MISSING_IN_POS';

function getValidNum(...vals: any[]): number | undefined {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v))) {
      return Number(v);
    }
  }
  return undefined;
}

function getItemCategory(item: ErpPosComparisonItem): 'MATCHED' | 'MISMATCHED' | 'MISSING_IN_ERP' | 'MISSING_IN_POS' {
  if (item.category) {
    const c = String(item.category).toUpperCase();
    if (c === 'MISMATCHED') return 'MISMATCHED';
    if (c === 'MISSING_IN_ERP') return 'MISSING_IN_ERP';
    if (c === 'MISSING_IN_POS') return 'MISSING_IN_POS';
    if (c === 'MATCHED') return 'MATCHED';
  }

  if (item.status) {
    const s = String(item.status).toUpperCase();
    if (s === 'MISMATCHED' || s === 'MISMATCH') return 'MISMATCHED';
    if (s === 'MISSING_IN_ERP' || s === 'ERP_MISSING' || s === 'MISSING_ERP') return 'MISSING_IN_ERP';
    if (s === 'MISSING_IN_POS' || s === 'POS_MISSING' || s === 'MISSING_POS') return 'MISSING_IN_POS';
    if (s === 'MATCHED') return 'MATCHED';
  }

  const posAmt = getValidNum(item.pos_amount, item.pos_total_amount, item.pos_amt, item.total_amount, item.amount) ?? 0;
  const erpAmt = getValidNum(item.erp_amount, item.erp_total_amount, item.erp_amt) ?? 0;
  const posQty = getValidNum(item.pos_qty, item.pos_quantity, item.pos_count) ?? 0;
  const erpQty = getValidNum(item.erp_qty, item.erp_quantity, item.erp_count) ?? 0;
  const amtDiff = Number(item.amount_diff ?? (posAmt - erpAmt));
  const qtyDiff = Number(item.qty_diff ?? (posQty - erpQty));

  if (posAmt > 0 && erpAmt === 0) return 'MISSING_IN_ERP';
  if (erpAmt > 0 && posAmt === 0) return 'MISSING_IN_POS';

  if (amtDiff !== 0 || qtyDiff !== 0) {
    return 'MISMATCHED';
  }
  return 'MATCHED';
}

export const ErpPosComparisonScreen: React.FC<{ navigation?: any }> = () => {
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

  // Date Picker Modal State
  const [activePickerTarget, setActivePickerTarget] = useState<'FROM' | 'TO' | null>(null);

  // Branch Selection State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<FilterCategory>('ALL');
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE);

  // API Data State
  const [records, setRecords] = useState<ErpPosComparisonItem[]>([]);
  const [apiSummary, setApiSummary] = useState<ErpPosSummary | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load available branches list on mount
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
    async (showFeedback = false, overrideFrom?: string, overrideTo?: string) => {
      setIsLoading(true);
      setErrorMessage(null);

      const fDate = overrideFrom || fromDate;
      const tDate = overrideTo || toDate;
      const branchCodeParam = selectedBranchCodes.join(',');

      const res = await fetchErpPosComparison({
        from_date: fDate,
        to_date: tDate,
        branch_code: branchCodeParam,
      });

      if (res.isLive) {
        setRecords(res.data);
        setApiSummary(res.summary);
        setIsLiveApi(true);
        closeFilterModal();
      } else {
        setIsLiveApi(false);
        setRecords([]);
        setApiSummary(undefined);
        setErrorMessage(res.error || 'Failed to connect to ERP-POS Comparison API.');
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
    setViewFilter('ALL');
    setSelectedPreset('TODAY');
    setDisplayLimit(INITIAL_PAGE_SIZE);
    loadData(true, today, today);
  };

  // Filtered dataset memoized for smooth rendering
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return records.filter((item) => {
      const branchName = (item.branch_name || item.store_name || item.branch_code || '').toLowerCase();
      const code = String(item.branch_code || '').toLowerCase();
      const posInv = String(item.invoice_no || '').toLowerCase();
      const erpInv = String(item.erp_invoice_no || '').toLowerCase();

      const matchesSearch =
        !query ||
        branchName.includes(query) ||
        code.includes(query) ||
        posInv.includes(query) ||
        erpInv.includes(query);

      const cat = getItemCategory(item);

      if (viewFilter === 'MATCHED' && cat !== 'MATCHED') return false;
      if (viewFilter === 'MISMATCHED' && cat !== 'MISMATCHED') return false;
      if (viewFilter === 'MISSING_IN_ERP' && cat !== 'MISSING_IN_ERP') return false;
      if (viewFilter === 'MISSING_IN_POS' && cat !== 'MISSING_IN_POS') return false;

      return matchesSearch;
    });
  }, [records, searchQuery, viewFilter]);

  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, displayLimit);
  }, [filteredRecords, displayLimit]);

  const summaryCounts = useMemo(() => {
    let matched = 0;
    let mismatched = 0;
    let missing_in_erp = 0;
    let missing_in_pos = 0;

    records.forEach((r) => {
      const cat = getItemCategory(r);
      if (cat === 'MISMATCHED') mismatched++;
      else if (cat === 'MISSING_IN_ERP') missing_in_erp++;
      else if (cat === 'MISSING_IN_POS') missing_in_pos++;
      else matched++;
    });

    if (records.length === 0 && apiSummary) {
      return apiSummary;
    }

    return { matched, mismatched, missing_in_erp, missing_in_pos };
  }, [records, apiSummary]);

  const loadMoreItems = () => {
    if (displayLimit < filteredRecords.length) {
      setDisplayLimit((prev) => prev + INITIAL_PAGE_SIZE);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Unified Top Filter Action Bar */}
      <UnifiedTopFilterBar
        fromDate={fromDate}
        toDate={toDate}
        extraPills={[{ icon: Building2, label: getStoreFilterLabel(selectedBranchCodes, branches) }]}
        onToggleFilters={openFilterModal}
        onRefreshData={handleApplyClick}
      />

      {/* Executive Summary Matrix Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -14, paddingHorizontal: 14 }}>
        <View style={styles.kpiWrap}>
          {/* Card 1: Matched Invoices */}
          <View style={[styles.kpiCardStrip, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#dcfce7' }]}>
              <CheckCircle2 size={15} color="#16a34a" />
            </View>
            <View>
              <Text style={[styles.kpiLabelText, { color: '#15803d' }]}>MATCHED INVOICES</Text>
              <Text style={[styles.kpiValueText, { color: '#166534' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatNumber(summaryCounts.matched)}
              </Text>
            </View>
          </View>

          {/* Card 2: Mismatched Invoices */}
          <View style={[styles.kpiCardStrip, { backgroundColor: isDark ? '#1e293b' : '#fffbe5', borderColor: '#fef08a' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#fef9c3' }]}>
              <AlertCircle size={15} color="#ca8a04" />
            </View>
            <View>
              <Text style={[styles.kpiLabelText, { color: '#a16207' }]}>MISMATCHED</Text>
              <Text style={[styles.kpiValueText, { color: '#713f12' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatNumber(summaryCounts.mismatched)}
              </Text>
            </View>
          </View>

          {/* Card 3: Missing in ERP */}
          <View style={[styles.kpiCardStrip, { backgroundColor: isDark ? '#1e293b' : '#fef2f2', borderColor: '#fca5a5' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#fee2e2' }]}>
              <FileQuestion size={15} color="#dc2626" />
            </View>
            <View>
              <Text style={[styles.kpiLabelText, { color: '#991b1b' }]}>MISSING IN ERP</Text>
              <Text style={[styles.kpiValueText, { color: '#991b1b' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatNumber(summaryCounts.missing_in_erp)}
              </Text>
            </View>
          </View>

          {/* Card 4: Missing in POS */}
          <View style={[styles.kpiCardStrip, { backgroundColor: isDark ? '#1e293b' : '#faf5ff', borderColor: '#e9d5ff' }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#f3e8ff' }]}>
              <AlertTriangle size={15} color="#9333ea" />
            </View>
            <View>
              <Text style={[styles.kpiLabelText, { color: '#7e22ce' }]}>MISSING IN POS</Text>
              <Text style={[styles.kpiValueText, { color: '#6b21a8' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatNumber(summaryCounts.missing_in_pos)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabChip,
            { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
            viewFilter === 'ALL' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => {
            setViewFilter('ALL');
            setDisplayLimit(INITIAL_PAGE_SIZE);
          }}
        >
          <Text style={[styles.tabChipText, { color: viewFilter === 'ALL' ? '#ffffff' : theme.textSecondary }]}>
            All ({records.length.toLocaleString('en-IN')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabChip,
            { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
            viewFilter === 'MATCHED' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => {
            setViewFilter('MATCHED');
            setDisplayLimit(INITIAL_PAGE_SIZE);
          }}
        >
          <Text style={[styles.tabChipText, { color: viewFilter === 'MATCHED' ? '#ffffff' : theme.textSecondary }]}>
            Matched ({summaryCounts.matched.toLocaleString('en-IN')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabChip,
            { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
            viewFilter === 'MISMATCHED' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => {
            setViewFilter('MISMATCHED');
            setDisplayLimit(INITIAL_PAGE_SIZE);
          }}
        >
          <Text style={[styles.tabChipText, { color: viewFilter === 'MISMATCHED' ? '#ffffff' : theme.textSecondary }]}>
            Mismatched ({summaryCounts.mismatched.toLocaleString('en-IN')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabChip,
            { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
            viewFilter === 'MISSING_IN_ERP' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => {
            setViewFilter('MISSING_IN_ERP');
            setDisplayLimit(INITIAL_PAGE_SIZE);
          }}
        >
          <Text style={[styles.tabChipText, { color: viewFilter === 'MISSING_IN_ERP' ? '#ffffff' : theme.textSecondary }]}>
            Missing ERP ({summaryCounts.missing_in_erp.toLocaleString('en-IN')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabChip,
            { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
            viewFilter === 'MISSING_IN_POS' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => {
            setViewFilter('MISSING_IN_POS');
            setDisplayLimit(INITIAL_PAGE_SIZE);
          }}
        >
          <Text style={[styles.tabChipText, { color: viewFilter === 'MISSING_IN_POS' ? '#ffffff' : theme.textSecondary }]}>
            Missing POS ({summaryCounts.missing_in_pos.toLocaleString('en-IN')})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {filteredRecords.length > 0 && (
        <View style={styles.recordsCounterRow}>
          <Text style={[styles.recordsCounterText, { color: theme.textSecondary }]}>
            Showing <Text style={[styles.boldText, { color: theme.textPrimary }]}>{visibleRecords.length.toLocaleString('en-IN')}</Text> of{' '}
            <Text style={[styles.boldText, { color: theme.textPrimary }]}>{filteredRecords.length.toLocaleString('en-IN')}</Text> comparison items
          </Text>
        </View>
      )}
    </View>
  );

  const renderItem = ({ item, index }: { item: ErpPosComparisonItem; index: number }) => {
    const branchName = item.branch_name || item.store_name || `Branch ${item.branch_code || index + 1}`;
    const branchCode = item.branch_code || 'N/A';
    const posInv = item.invoice_no || item.pos_invoice_no || item.bill_no || item.invoice_number || 'N/A';
    const erpInv = item.erp_invoice_no || item.erp_bill_no || item.voucher_no || item.erp_invoice_number || 'N/A';
    const recordDate = item.date || item.from_date || item.bill_date || null;

    const cat = getItemCategory(item);

    let posQty = 0;
    let erpQty = 0;
    let posAmount = 0;
    let erpAmount = 0;

    if (cat === 'MISSING_IN_POS') {
      posQty = 0;
      posAmount = 0;
      erpQty = getValidNum(item.erp_qty, item.erp_quantity, item.qty, item.total_qty, item.erp_count) ?? 1;
      erpAmount = getValidNum(item.erp_amount, item.erp_total_amount, item.erp_amt, item.total_amount, item.amount) ?? 0;
    } else if (cat === 'MISSING_IN_ERP') {
      erpQty = 0;
      erpAmount = 0;
      posQty = getValidNum(item.pos_qty, item.pos_quantity, item.qty, item.total_qty, item.pos_count) ?? 1;
      posAmount = getValidNum(item.pos_amount, item.pos_total_amount, item.pos_amt, item.total_amount, item.amount) ?? 0;
    } else {
      posQty = getValidNum(item.pos_qty, item.pos_quantity, item.qty, item.total_qty, item.pos_count) ?? 0;
      erpQty = getValidNum(item.erp_qty, item.erp_quantity, item.qty, item.total_qty, item.erp_count) ?? 0;
      posAmount = getValidNum(item.pos_amount, item.pos_total_amount, item.pos_amt, item.total_amount, item.amount) ?? 0;
      erpAmount = getValidNum(item.erp_amount, item.erp_total_amount, item.erp_amt, item.total_amount, item.amount) ?? 0;
    }

    const amountDiff = item.amount_diff !== undefined && item.amount_diff !== null
      ? Number(item.amount_diff)
      : (posAmount - erpAmount);

    const qtyDiff = item.qty_diff !== undefined && item.qty_diff !== null
      ? Number(item.qty_diff)
      : (posQty - erpQty);

    let badgeLabel = 'MATCHED';
    let badgeVariant: 'success' | 'warning' | 'danger' | 'info' = 'success';

    if (cat === 'MISMATCHED') {
      badgeLabel = `MISMATCH`;
      badgeVariant = 'warning';
    } else if (cat === 'MISSING_IN_ERP') {
      badgeLabel = 'MISSING IN ERP';
      badgeVariant = 'danger';
    } else if (cat === 'MISSING_IN_POS') {
      badgeLabel = 'MISSING IN POS';
      badgeVariant = 'danger';
    }

    return (
      <View style={[styles.itemCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        {/* Item Card Top Row: Branch Info & Status Badge */}
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemBranchName, { color: theme.textPrimary }]} numberOfLines={1}>
              {branchName}
            </Text>
            <Text style={[styles.itemBranchCode, { color: theme.textMuted }]} numberOfLines={1}>
              Code: {branchCode}{recordDate ? ` • ${recordDate}` : ''}
            </Text>
          </View>
          <Badge label={badgeLabel} variant={badgeVariant} showDot />
        </View>

        {/* Invoice References Badges */}
        <View style={styles.invoiceNumbersRow}>
          <View style={[styles.invPill, { backgroundColor: isDark ? '#1e3a5f' : '#f0f9ff', borderColor: isDark ? '#1e40af' : '#bae6fd' }]}>
            <Text style={[styles.invPillLabel, { color: isDark ? '#93c5fd' : '#0284c7' }]}>POS Inv:</Text>
            <Text style={[styles.invPillVal, { color: theme.textPrimary }]} numberOfLines={1}>
              {posInv}
            </Text>
          </View>

          <View style={[styles.invPill, { backgroundColor: isDark ? '#14382c' : '#f0fdf4', borderColor: isDark ? '#065f46' : '#bbf7d0' }]}>
            <Text style={[styles.invPillLabel, { color: isDark ? '#6ee7b7' : '#16a34a' }]}>ERP Inv:</Text>
            <Text style={[styles.invPillVal, { color: theme.textPrimary }]} numberOfLines={1}>
              {erpInv}
            </Text>
          </View>
        </View>

        {/* Side-by-Side Comparison Box */}
        <View style={styles.comparisonGrid}>
          <View style={[styles.compBox, { backgroundColor: isDark ? '#1e3a5f22' : '#f8fafc', borderColor: theme.border }]}>
            <Text style={[styles.compBoxLabel, { color: isDark ? '#93c5fd' : '#0284c7' }]}>POS TERMINAL</Text>
            <Text style={[styles.compBoxQty, { color: theme.textSecondary }]}>Qty: {posQty} Pcs</Text>
            <Text style={[styles.compBoxAmt, { color: isDark ? '#93c5fd' : '#0284c7' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {formatCurrency(posAmount)}
            </Text>
          </View>

          <View style={[styles.vsCircle, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <ArrowRightLeft size={13} color={theme.primary} />
          </View>

          <View style={[styles.compBox, { backgroundColor: isDark ? '#14382c22' : '#f8fafc', borderColor: theme.border }]}>
            <Text style={[styles.compBoxLabel, { color: isDark ? '#6ee7b7' : '#16a34a' }]}>ERP SYSTEM</Text>
            <Text style={[styles.compBoxQty, { color: theme.textSecondary }]}>Qty: {erpQty} Pcs</Text>
            <Text style={[styles.compBoxAmt, { color: isDark ? '#6ee7b7' : '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {formatCurrency(erpAmount)}
            </Text>
          </View>
        </View>

        {/* Discrepancy Highlight Banner */}
        {cat !== 'MATCHED' && (
          <View style={[
            styles.diffBanner,
            cat === 'MISMATCHED'
              ? { backgroundColor: isDark ? '#3f2e1e' : '#fffbe5', borderColor: '#fef08a' }
              : { backgroundColor: isDark ? '#3f1d1d' : '#fef2f2', borderColor: '#fca5a5' }
          ]}>
            {cat === 'MISMATCHED' ? (
              <AlertCircle size={14} color="#d97706" style={{ marginRight: 6 }} />
            ) : (
              <AlertTriangle size={14} color="#dc2626" style={{ marginRight: 6 }} />
            )}
            <Text style={[styles.diffBannerText, { color: cat === 'MISMATCHED' ? (isDark ? '#fde047' : '#b45309') : (isDark ? '#fca5a5' : '#b91c1c') }]}>
              {cat === 'MISMATCHED'
                ? `Variance: Qty Diff = ${qtyDiff} Pcs • Amount Diff = ${formatCurrency(amountDiff)}`
                : cat === 'MISSING_IN_ERP'
                ? `Notice: Invoice exists in POS but is missing from ERP database.`
                : `Notice: Invoice recorded in ERP but missing from POS terminal.`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (visibleRecords.length < filteredRecords.length) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreItems} activeOpacity={0.8}>
          <ChevronDown size={18} color="#2563eb" style={{ marginRight: 6 }} />
          <Text style={styles.loadMoreBtnText}>
            Load More Records ({filteredRecords.length - visibleRecords.length} Remaining)
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={{ height: 20 }} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <TopAppBar
        title="ERP vs POS Comparison"
        subtitle={`Branch Audit (${getStoreFilterLabel(selectedBranchCodes, branches)})`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Analyzing ERP vs POS Invoices...</Text>
        </View>
      ) : errorMessage && records.length === 0 ? (
        <View style={styles.errorBox}>
          <AlertTriangle size={32} color="#dc2626" style={{ marginBottom: 8 }} />
          <Text style={styles.errorTitle}>Error Loading Comparison</Text>
          <Text style={styles.errorSub}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleApplyClick}>
            <Text style={styles.retryBtnText}>Retry Audit Fetch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleRecords}
          keyExtractor={(item, index) =>
            `${item.branch_code || 'item'}-${item.invoice_no || item.erp_invoice_no || index}-${index}`
          }
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <GitCompare size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No Invoice Comparison Records Found</Text>
              <Text style={styles.emptySub}>
                Tap "Apply Date Filter" or adjust date range / branch selection.
              </Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Unified Filter Modal — Rendered at Root level outside FlatList */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="ERP vs POS Filters"
        selectedPreset={selectedPreset}
        fromDate={fromDate}
        toDate={toDate}
        onClose={closeFilterModal}
        onApplyPreset={applyPreset}
        onSelectDate={(newDate: string, target: 'FROM' | 'TO') => {
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

        {/* Category Status Filter */}
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>View Filter Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              style={[
                styles.presetPillModal,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                viewFilter === 'ALL' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setViewFilter('ALL')}
            >
              <Text style={[styles.presetTextModal, { color: theme.textSecondary }, viewFilter === 'ALL' && styles.presetTextModalActive]}>All Invoices</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.presetPillModal,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                viewFilter === 'MATCHED' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setViewFilter('MATCHED')}
            >
              <Text style={[styles.presetTextModal, { color: theme.textSecondary }, viewFilter === 'MATCHED' && styles.presetTextModalActive]}>Matched</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.presetPillModal,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                viewFilter === 'MISMATCHED' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setViewFilter('MISMATCHED')}
            >
              <Text style={[styles.presetTextModal, { color: theme.textSecondary }, viewFilter === 'MISMATCHED' && styles.presetTextModalActive]}>Mismatched</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.presetPillModal,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                viewFilter === 'MISSING_IN_ERP' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setViewFilter('MISSING_IN_ERP')}
            >
              <Text style={[styles.presetTextModal, { color: theme.textSecondary }, viewFilter === 'MISSING_IN_ERP' && styles.presetTextModalActive]}>Missing in ERP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.presetPillModal,
                { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                viewFilter === 'MISSING_IN_POS' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setViewFilter('MISSING_IN_POS')}
            >
              <Text style={[styles.presetTextModal, { color: theme.textSecondary }, viewFilter === 'MISSING_IN_POS' && styles.presetTextModalActive]}>Missing in POS</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </UnifiedFilterModal>

      {/* Standalone Branch Selector Modal — Rendered at Root level outside FlatList */}
      <BranchSelectorModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        selectedBranchCodes={selectedBranchCodes}
        onApply={(newCodes) => {
          setSelectedBranchCodes(newCodes);
          handleApplyClick();
        }}
        title="Select Branches to Audit"
      />

      {/* Date Picker Modal — Rendered at Root level outside FlatList */}
      <DatePickerModal
        visible={activePickerTarget !== null}
        onClose={() => setActivePickerTarget(null)}
        value={activePickerTarget === 'FROM' ? fromDate : toDate}
        title={activePickerTarget === 'FROM' ? 'Select From Date' : 'Select To Date'}
        onSelectDate={(newDate) => {
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
  container: {
    flex: 1,
  },
  flatListContent: {
    padding: 14,
    paddingBottom: 120,
    gap: 12,
  },
  headerContainer: {
    gap: 12,
    marginBottom: 6,
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
  kpiWrap: { flexDirection: 'row', gap: 8 },
  kpiCardStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 135,
  },
  kpiIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kpiLabelText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.3 },
  kpiValueText: { fontSize: 13, fontWeight: '900', marginTop: 1 },

  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordsCounterRow: {
    paddingHorizontal: 2,
  },
  recordsCounterText: {
    fontSize: 11,
  },
  boldText: {
    fontWeight: '800',
  },
  itemCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBranchName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  itemBranchCode: {
    fontSize: 10.5,
    marginTop: 1,
  },
  invoiceNumbersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  invPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  invPillLabel: { fontSize: 9.5, fontWeight: '800' },
  invPillVal: { flex: 1, fontSize: 10.5, fontWeight: '700' },
  itemDivider: {
    height: 1,
  },
  comparisonGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  compBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  compBoxQty: {
    fontSize: 10.5,
    marginTop: 2,
  },
  compBoxAmt: {
    fontSize: 13.5,
    fontWeight: '900',
    marginTop: 2,
  },
  vsCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -2,
    zIndex: 2,
  },
  diffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  diffBannerText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '700',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadMoreBtnText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
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
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
