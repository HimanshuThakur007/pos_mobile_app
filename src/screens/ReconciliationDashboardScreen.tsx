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
  fetchConsolidatedReconciliation,
  ConsolidatedReconciliationData,
  StoreSyncHealth,
} from '../api/reconciliationApi';
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
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Scale,
  RefreshCw,
} from 'lucide-react-native';

export const ReconciliationDashboardScreen: React.FC<{ navigation?: any }> = () => {
  const { theme, isDark } = useTheme();

  // Global filter state
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

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllDiscrepancies, setShowAllDiscrepancies] = useState(false);

  const [data, setData] = useState<ConsolidatedReconciliationData>({
    syncHealthPct: 100,
    totalAuditedSales: 0,
    totalVarianceAmount: 0,
    totalInvoicesAudited: 0,
    matchedInvoicesCount: 0,
    mismatchedInvoicesCount: 0,
    missingInErpCount: 0,
    missingInPosCount: 0,
    discrepantStoresCount: 0,
    totalStoresCount: 0,
    pipeline: {
      desktop_count: 0,
      central_count: 0,
      erp_count: 0,
      desktop_to_central_loss: 0,
      central_to_erp_loss: 0,
      parity_health_pct: 100,
    },
    tender: {
      cash_amount: 0,
      card_amount: 0,
      upi_amount: 0,
      other_amount: 0,
      total_tender_collected: 0,
      net_sales_recorded: 0,
      tender_difference: 0,
      is_balanced: true,
    },
    discrepantRecords: [],
    storeHealthLeaderboard: [],
    isLive: true,
  });

  // Load available branches
  useEffect(() => {
    fetchBranches()
      .then((res) => {
        if (res.data && res.data.length > 0) setBranches(res.data);
      })
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

      const targetFrom = overrideFrom !== undefined ? overrideFrom : fromDate;
      const targetTo = overrideTo !== undefined ? overrideTo : toDate;
      const targetBranchCodes = overrideBranches !== undefined ? overrideBranches : selectedBranchCodes;

      const res = await fetchConsolidatedReconciliation({
        from_date: targetFrom,
        to_date: targetTo,
        branch_code: targetBranchCodes.length > 0 ? targetBranchCodes.join(',') : undefined,
      });

      setData(res);
      setIsLoading(false);

      if (!res.isLive && res.errorMessage && showFeedback) {
        Alert.alert('Reconciliation Alert', res.errorMessage);
      }
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

  // Filter store leaderboard by search query
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return data.storeHealthLeaderboard;
    const q = searchQuery.toLowerCase().trim();
    return data.storeHealthLeaderboard.filter(
      (s) => s.branch_name.toLowerCase().includes(q) || s.branch_code.toLowerCase().includes(q)
    );
  }, [data.storeHealthLeaderboard, searchQuery]);

  const isOverallHealthy = data.syncHealthPct >= 98 && data.totalVarianceAmount < 10000;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Reconciliation Dashboard"
        subtitle={`Audit & Balancing • ${getStoreFilterLabel(selectedBranchCodes, branches)}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {/* Top Filter Bar */}
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

      {isLoading && data.totalInvoicesAudited === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Consolidating POS, ERP & Tender audits...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {/* ═══════════════════════════════════════════
              1. EXECUTIVE RECONCILIATION HEALTH HERO BANNER
          ═══════════════════════════════════════════ */}
          <View
            style={[
              styles.heroBanner,
              {
                backgroundColor: isDark
                  ? isOverallHealthy ? '#064e3b22' : '#450a0a22'
                  : isOverallHealthy ? '#f0fdf4' : '#fef2f2',
                borderColor: isOverallHealthy ? '#86efac' : '#fca5a5',
              },
            ]}
          >
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <ShieldCheck size={16} color={isOverallHealthy ? '#16a34a' : '#dc2626'} />
                  <Text style={[styles.heroLabel, { color: isOverallHealthy ? '#16a34a' : '#dc2626' }]}>
                    {isOverallHealthy ? 'System Sync Healthy' : 'Audit Attention Needed'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.heroValue,
                    { color: isOverallHealthy ? (isDark ? '#86efac' : '#15803d') : (isDark ? '#fca5a5' : '#b91c1c') },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {data.syncHealthPct}% Synced
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View
                  style={[
                    styles.heroChip,
                    { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.heroChipText, { color: data.totalVarianceAmount > 0 ? '#ef4444' : theme.textPrimary }]}>
                    Variance: {data.totalVarianceAmount > 0 ? formatCurrency(data.totalVarianceAmount) : '₹0'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.heroChip,
                    { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.heroChipText, { color: theme.textSecondary }]}>
                    {data.discrepantStoresCount > 0
                      ? `${data.discrepantStoresCount} Stores with Diff`
                      : 'All Stores In Sync'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              2. 6-KPI TOTALS STRIP (3 cols × 2 rows)
          ═══════════════════════════════════════════ */}
          <View style={styles.kpiSection}>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Audited Sales</Text>
                <Text style={[styles.kpiValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatCurrency(data.totalAuditedSales)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Matched Bills</Text>
                <Text style={[styles.kpiValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatNumber(data.matchedInvoicesCount)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Variance Amount</Text>
                <Text style={[styles.kpiValue, { color: data.totalVarianceAmount > 0 ? '#ef4444' : theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatCurrency(data.totalVarianceAmount)}
                </Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Missing in ERP</Text>
                <Text style={[styles.kpiValue, { color: data.missingInErpCount > 0 ? '#ef4444' : theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatNumber(data.missingInErpCount)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Missing in POS</Text>
                <Text style={[styles.kpiValue, { color: data.missingInPosCount > 0 ? '#f59e0b' : theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {formatNumber(data.missingInPosCount)}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Tender Delta</Text>
                <Text
                  style={[
                    styles.kpiValue,
                    { color: data.tender.is_balanced ? '#16a34a' : '#ef4444' },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {data.tender.is_balanced ? 'Balanced' : formatCurrency(data.tender.tender_difference)}
                </Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              3. SYSTEM SYNC AUDIT (ERP vs POS)
          ═══════════════════════════════════════════ */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Scale size={14} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                ERP vs POS Sync Breakdown
              </Text>
            </View>

            <View style={styles.statusGrid}>
              <View style={[styles.statusCard, { backgroundColor: isDark ? '#064e3b22' : '#f0fdf4', borderColor: '#86efac' }]}>
                <CheckCircle2 size={16} color="#16a34a" />
                <Text style={[styles.statusCardValue, { color: '#16a34a' }]}>
                  {formatNumber(data.matchedInvoicesCount)}
                </Text>
                <Text style={[styles.statusCardLabel, { color: isDark ? '#86efac' : '#15803d' }]}>
                  Matched Invoices
                </Text>
              </View>

              <View style={[styles.statusCard, { backgroundColor: isDark ? '#451a0322' : '#fffbeb', borderColor: '#fde68a' }]}>
                <AlertTriangle size={16} color="#d97706" />
                <Text style={[styles.statusCardValue, { color: '#d97706' }]}>
                  {formatNumber(data.mismatchedInvoicesCount)}
                </Text>
                <Text style={[styles.statusCardLabel, { color: isDark ? '#fde68a' : '#b45309' }]}>
                  Mismatched
                </Text>
              </View>

              <View style={[styles.statusCard, { backgroundColor: isDark ? '#450a0a22' : '#fef2f2', borderColor: '#fca5a5' }]}>
                <AlertCircle size={16} color="#dc2626" />
                <Text style={[styles.statusCardValue, { color: '#dc2626' }]}>
                  {formatNumber(data.missingInErpCount)}
                </Text>
                <Text style={[styles.statusCardLabel, { color: isDark ? '#fca5a5' : '#b91c1c' }]}>
                  Missing in ERP
                </Text>
              </View>

              <View style={[styles.statusCard, { backgroundColor: isDark ? '#3b1c0622' : '#fff7ed', borderColor: '#fed7aa' }]}>
                <AlertTriangle size={16} color="#ea580c" />
                <Text style={[styles.statusCardValue, { color: '#ea580c' }]}>
                  {formatNumber(data.missingInPosCount)}
                </Text>
                <Text style={[styles.statusCardLabel, { color: isDark ? '#fed7aa' : '#c2410c' }]}>
                  Missing in POS
                </Text>
              </View>
            </View>
          </View>

          {/* ── Active Discrepancies List (if any) ── */}
          {data.discrepantRecords.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <FileText size={14} color="#ef4444" />
                <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>
                  Active Discrepancy Stream ({data.discrepantRecords.length} Items)
                </Text>
              </View>

              <View style={[styles.discrepancyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                {(showAllDiscrepancies ? data.discrepantRecords : data.discrepantRecords.slice(0, 5)).map((item, idx) => {
                  const cat = String(item.category || item.status || 'MISMATCHED').toUpperCase();
                  const posAmt = Number(item.pos_amount ?? item.pos_total_amount ?? 0);
                  const erpAmt = Number(item.erp_amount ?? item.erp_total_amount ?? 0);
                  const diff = Math.abs(Number(item.amount_diff ?? (posAmt - erpAmt)));

                  return (
                    <View
                      key={item.invoice_no || `disc-${idx}`}
                      style={[
                        styles.discrepancyRow,
                        { borderBottomColor: theme.border },
                        idx === (showAllDiscrepancies ? data.discrepantRecords.length : 5) - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.discInvoice, { color: theme.textPrimary }]}>
                            {item.invoice_no || item.erp_invoice_no || `Invoice #${idx + 1}`}
                          </Text>
                          <View
                            style={[
                              styles.catBadge,
                              {
                                backgroundColor:
                                  cat === 'MISSING_IN_ERP' ? '#fee2e2' : cat === 'MISSING_IN_POS' ? '#ffedd5' : '#fef3c7',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.catBadgeText,
                                {
                                  color:
                                    cat === 'MISSING_IN_ERP' ? '#991b1b' : cat === 'MISSING_IN_POS' ? '#9a3412' : '#92400e',
                                },
                              ]}
                            >
                              {cat.replace(/_/g, ' ')}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.discStore, { color: theme.textMuted }]}>
                          {item.branch_name || item.store_name || `Store ${item.branch_code || ''}`}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.discDiffAmt, { color: '#ef4444' }]}>
                          Diff: {formatCurrency(diff)}
                        </Text>
                        <Text style={[styles.discComparison, { color: theme.textSecondary }]}>
                          POS: {formatCurrency(posAmt)} | ERP: {formatCurrency(erpAmt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {data.discrepantRecords.length > 5 && (
                  <TouchableOpacity
                    style={[styles.showMoreBtn, { borderTopColor: theme.border }]}
                    onPress={() => setShowAllDiscrepancies((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.showMoreText, { color: theme.primary }]}>
                      {showAllDiscrepancies ? 'Show Top 5 Only' : `View All ${data.discrepantRecords.length} Discrepancies`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════
              4. BILL COUNT PIPELINE PARITY
          ═══════════════════════════════════════════ */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Layers size={14} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Bill Parity Pipeline (Sync Architecture)
              </Text>
            </View>

            <View style={[styles.pipelineCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.pipelineFlow}>
                {/* Step 1: Desktop App */}
                <View style={styles.pipelineNode}>
                  <Text style={[styles.pipelineNodeLabel, { color: theme.textMuted }]}>Desktop POS</Text>
                  <Text style={[styles.pipelineNodeValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatNumber(data.pipeline.desktop_count || data.pipeline.central_count)}
                  </Text>
                  <Text style={[styles.pipelineNodeSub, { color: theme.textMuted }]}>Local Terminals</Text>
                </View>

                {/* Arrow 1 */}
                <View style={styles.pipelineArrowCol}>
                  <ArrowRight size={14} color={theme.textMuted} />
                  {data.pipeline.desktop_to_central_loss > 0 && (
                    <Text style={styles.pipelineLossBadge}>-{data.pipeline.desktop_to_central_loss}</Text>
                  )}
                </View>

                {/* Step 2: Central Server */}
                <View style={styles.pipelineNode}>
                  <Text style={[styles.pipelineNodeLabel, { color: theme.textMuted }]}>Central POS</Text>
                  <Text style={[styles.pipelineNodeValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatNumber(data.pipeline.central_count)}
                  </Text>
                  <Text style={[styles.pipelineNodeSub, { color: theme.textMuted }]}>Cloud Database</Text>
                </View>

                {/* Arrow 2 */}
                <View style={styles.pipelineArrowCol}>
                  <ArrowRight size={14} color={theme.textMuted} />
                  {data.pipeline.central_to_erp_loss > 0 && (
                    <Text style={styles.pipelineLossBadge}>-{data.pipeline.central_to_erp_loss}</Text>
                  )}
                </View>

                {/* Step 3: ERP */}
                <View style={styles.pipelineNode}>
                  <Text style={[styles.pipelineNodeLabel, { color: theme.textMuted }]}>ERP Ledger</Text>
                  <Text style={[styles.pipelineNodeValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatNumber(data.pipeline.erp_count)}
                  </Text>
                  <Text style={[styles.pipelineNodeSub, { color: theme.textMuted }]}>Financial Ledger</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              5. TENDER & PAYMENT BALANCING
          ═══════════════════════════════════════════ */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <CreditCard size={14} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Tender & Collection Balancing
              </Text>
            </View>

            <View style={[styles.tenderCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              {/* Tender comparison header */}
              <View style={styles.tenderHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tenderHeaderLabel, { color: theme.textMuted }]}>Total Tender Collected</Text>
                  <Text style={[styles.tenderHeaderValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatCurrency(data.tender.total_tender_collected)}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[styles.tenderHeaderLabel, { color: theme.textMuted }]}>Net Sales Recorded</Text>
                  <Text style={[styles.tenderHeaderValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatCurrency(data.tender.net_sales_recorded)}
                  </Text>
                </View>
              </View>

              {/* Payment Mode Pills */}
              <View style={[styles.tenderSplitRow, { backgroundColor: isDark ? '#1e293b44' : '#f8fafc', borderColor: theme.border }]}>
                <View style={styles.tenderCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Banknote size={11} color="#16a34a" />
                    <Text style={[styles.tenderColLabel, { color: theme.textMuted }]}>Cash</Text>
                  </View>
                  <Text style={[styles.tenderColValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatCurrency(data.tender.cash_amount)}
                  </Text>
                </View>

                <View style={[styles.tenderDivider, { backgroundColor: theme.border }]} />

                <View style={styles.tenderCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <CreditCard size={11} color="#3b82f6" />
                    <Text style={[styles.tenderColLabel, { color: theme.textMuted }]}>Card</Text>
                  </View>
                  <Text style={[styles.tenderColValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatCurrency(data.tender.card_amount)}
                  </Text>
                </View>

                <View style={[styles.tenderDivider, { backgroundColor: theme.border }]} />

                <View style={styles.tenderCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Smartphone size={11} color="#8b5cf6" />
                    <Text style={[styles.tenderColLabel, { color: theme.textMuted }]}>UPI</Text>
                  </View>
                  <Text style={[styles.tenderColValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatCurrency(data.tender.upi_amount)}
                  </Text>
                </View>

                <View style={[styles.tenderDivider, { backgroundColor: theme.border }]} />

                <View style={styles.tenderCol}>
                  <Text style={[styles.tenderColLabel, { color: theme.textMuted }]}>Other</Text>
                  <Text style={[styles.tenderColValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatCurrency(data.tender.other_amount)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              6. STORE RECONCILIATION LEADERBOARD
          ═══════════════════════════════════════════ */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Building2 size={14} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Store Sync Health Audit ({filteredStores.length} Stores)
              </Text>
            </View>

            {/* Store Search */}
            <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginBottom: 8 }]}>
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

            <View style={styles.storeList}>
              {filteredStores.map((store) => {
                const isClean = store.status === 'PERFECT';
                const isCritical = store.status === 'CRITICAL';

                return (
                  <View
                    key={store.branch_code}
                    style={[
                      styles.storeCard,
                      {
                        backgroundColor: theme.cardBg,
                        borderColor: isCritical ? '#fca5a5' : isClean ? theme.border : '#fde68a',
                      },
                    ]}
                  >
                    {/* Header */}
                    <View style={styles.storeHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.storeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                          {store.branch_name}
                        </Text>
                        <Text style={[styles.storeCode, { color: theme.textMuted }]}>
                          Code: {store.branch_code} • {store.total_invoices} Invoices Audited
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.storeStatusBadge,
                          {
                            backgroundColor: isClean
                              ? (isDark ? '#064e3b44' : '#f0fdf4')
                              : isCritical
                              ? (isDark ? '#450a0a44' : '#fef2f2')
                              : (isDark ? '#451a0344' : '#fffbeb'),
                            borderColor: isClean ? '#86efac' : isCritical ? '#fca5a5' : '#fde68a',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.storeStatusText,
                            { color: isClean ? '#16a34a' : isCritical ? '#dc2626' : '#d97706' },
                          ]}
                        >
                          {isClean ? '100% Synced' : isCritical ? 'Critical Diff' : 'Sync Warning'}
                        </Text>
                      </View>
                    </View>

                    {/* Store Metrics Strip */}
                    <View style={[styles.storeMetricsRow, { backgroundColor: isDark ? '#1e293b44' : '#f8fafc', borderColor: theme.border }]}>
                      <View style={styles.storeMetricCol}>
                        <Text style={[styles.storeMetricLabel, { color: theme.textMuted }]}>Net Sales</Text>
                        <Text style={[styles.storeMetricValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {formatCurrency(store.net_sales)}
                        </Text>
                      </View>

                      <View style={[styles.storeMetricDivider, { backgroundColor: theme.border }]} />

                      <View style={styles.storeMetricCol}>
                        <Text style={[styles.storeMetricLabel, { color: theme.textMuted }]}>Matched Bills</Text>
                        <Text style={[styles.storeMetricValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {formatNumber(store.matched_invoices)}
                        </Text>
                      </View>

                      <View style={[styles.storeMetricDivider, { backgroundColor: theme.border }]} />

                      <View style={styles.storeMetricCol}>
                        <Text style={[styles.storeMetricLabel, { color: theme.textMuted }]}>Variance Amount</Text>
                        <Text
                          style={[
                            styles.storeMetricValue,
                            { color: store.variance_amount > 0 ? '#ef4444' : theme.textPrimary },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {store.variance_amount > 0 ? formatCurrency(store.variance_amount) : '₹0'}
                        </Text>
                      </View>
                    </View>

                    {/* Discrepancy counts tags if any */}
                    {(store.missing_in_erp > 0 || store.missing_in_pos > 0 || store.mismatched_invoices > 0) && (
                      <View style={styles.storeTagRow}>
                        {store.missing_in_erp > 0 && (
                          <View style={[styles.storeTag, { backgroundColor: '#fee2e2' }]}>
                            <Text style={[styles.storeTagText, { color: '#991b1b' }]}>
                              {store.missing_in_erp} Missing in ERP
                            </Text>
                          </View>
                        )}
                        {store.missing_in_pos > 0 && (
                          <View style={[styles.storeTag, { backgroundColor: '#ffedd5' }]}>
                            <Text style={[styles.storeTagText, { color: '#9a3412' }]}>
                              {store.missing_in_pos} Missing in POS
                            </Text>
                          </View>
                        )}
                        {store.mismatched_invoices > 0 && (
                          <View style={[styles.storeTag, { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.storeTagText, { color: '#92400e' }]}>
                              {store.mismatched_invoices} Amount Mismatch
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Filter Modal */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Reconciliation Filters"
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
          loadData(newCodes);
        }}
        title="Select Stores to Reconcile"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 10, fontSize: 13, fontWeight: '600' },

  // ── Hero Banner ──
  heroBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
  heroValue: { fontSize: 24, fontWeight: '900' },
  heroChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  heroChipText: { fontSize: 10, fontWeight: '800' },

  // ── KPI Grid ──
  kpiSection: { paddingHorizontal: 12, marginTop: 8, gap: 6 },
  kpiRow: { flexDirection: 'row', gap: 6 },
  kpiCard: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1 },
  kpiLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  kpiValue: { fontSize: 12, fontWeight: '800' },

  // ── Section Container ──
  sectionContainer: { paddingHorizontal: 12, marginTop: 14 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Status Grid (4 items) ──
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusCard: {
    width: '48.8%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 3,
  },
  statusCardValue: { fontSize: 16, fontWeight: '900' },
  statusCardLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },

  // ── Active Discrepancies Box ──
  discrepancyBox: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  discrepancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  discInvoice: { fontSize: 12, fontWeight: '800' },
  catBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  catBadgeText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  discStore: { fontSize: 10, marginTop: 2 },
  discDiffAmt: { fontSize: 11, fontWeight: '800' },
  discComparison: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  showMoreBtn: { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1 },
  showMoreText: { fontSize: 11, fontWeight: '800' },

  // ── Pipeline Parity ──
  pipelineCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  pipelineFlow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pipelineNode: { flex: 2, alignItems: 'center' },
  pipelineNodeLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  pipelineNodeValue: { fontSize: 14, fontWeight: '800' },
  pipelineNodeSub: { fontSize: 8, marginTop: 1 },
  pipelineArrowCol: { flex: 1, alignItems: 'center' },
  pipelineLossBadge: { fontSize: 9, fontWeight: '800', color: '#ef4444', marginTop: 2 },

  // ── Tender Card ──
  tenderCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 10 },
  tenderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tenderHeaderLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  tenderHeaderValue: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  tenderSplitRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  tenderCol: { flex: 1, paddingVertical: 7, paddingHorizontal: 6, alignItems: 'center' },
  tenderColLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  tenderColValue: { fontSize: 10, fontWeight: '800', marginTop: 1 },
  tenderDivider: { width: 1, alignSelf: 'stretch' },

  // ── Search Box ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  searchInput: { flex: 1, fontSize: 11, paddingVertical: 0 },

  // ── Store Leaderboard ──
  storeList: { gap: 8 },
  storeCard: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 8 },
  storeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storeTitle: { fontSize: 13, fontWeight: '800' },
  storeCode: { fontSize: 10, marginTop: 1 },
  storeStatusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  storeStatusText: { fontSize: 9, fontWeight: '800' },
  storeMetricsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, borderWidth: 1, overflow: 'hidden' },
  storeMetricCol: { flex: 1, paddingVertical: 6, paddingHorizontal: 6 },
  storeMetricLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  storeMetricValue: { fontSize: 11, fontWeight: '800', marginTop: 1 },
  storeMetricDivider: { width: 1, alignSelf: 'stretch' },
  storeTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  storeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  storeTagText: { fontSize: 9, fontWeight: '700' },
});
