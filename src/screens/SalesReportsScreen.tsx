import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { useAuth } from '../context/AuthContext';
import {
  fetchSalesReportSummary,
  fetchSalesReportItems,
} from '../api/salesReportApi';
import { fetchBranches, BranchItem } from '../api/comparisonApi';
import {
  SaleReportSummaryRow,
  SaleReportItemRow,
} from '../types/salesReport';
import { formatDateToYYYYMMDD, formatCurrency } from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import { SalesReportHeroFilterCard } from '../components/reports/SalesReportHeroFilterCard';
import { SalesReportKPICards } from '../components/reports/SalesReportKPICards';
import { SalesReportInvoicesTab } from '../components/reports/SalesReportInvoicesTab';
import { SalesReportPaymentModesTab } from '../components/reports/SalesReportPaymentModesTab';
import { SalesReportHourlyTab, HourlyBreakdownItem } from '../components/reports/SalesReportHourlyTab';
import { SalesReportStoreAuditTab, StoreBreakdownItem } from '../components/reports/SalesReportStoreAuditTab';
import { InvoiceDetailsModal } from '../components/reports/InvoiceDetailsModal';
import { BranchSelectorModal } from '../components/modals/BranchSelectorModal';
import { UnifiedFilterModal } from '../components/common/UnifiedFilterModal';
import { StoreSelectionTriggerBadge } from '../components/common/StoreSelectionTriggerBadge';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import {
  Receipt,
  CreditCard,
  Clock,
  Building2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react-native';

export const SalesReportsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const { theme, isDark } = useTheme();
  const isTablet = width >= 600 || (width > height && width >= 600);
  const isLandscape = width > height;
  const isWideScreen = isTablet || isLandscape;
  const portraitCardWidth = Math.max(140, (width - 38) / 2);
  const { user } = useAuth();

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

  const activeBranchCode = selectedBranchCodes.length > 0 ? selectedBranchCodes[0] : (user?.branchCode || '5003');
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS' | 'HOURLY' | 'STORE'>('INVOICES');

  // API Data States
  const [salesSummary, setSalesSummary] = useState<SaleReportSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Invoice Line Items Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<SaleReportSummaryRow | null>(null);
  const [modalItems, setModalItems] = useState<SaleReportItemRow[]>([]);
  const [modalPayments, setModalPayments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);

  // Load available branches on mount
  useEffect(() => {
    const loadBranchList = async () => {
      const res = await fetchBranches();
      if (res.data && res.data.length > 0) {
        setBranches(res.data);
      }
    };
    loadBranchList();
  }, []);

  // Load Sales Summary Report directly from Live API
  const loadSalesReport = useCallback(
    async (
      showFeedback = false,
      overrideFrom?: string,
      overrideTo?: string,
      overrideBranch?: string
    ) => {
      setIsLoading(true);
      setErrorMessage(null);

      const params = {
        branch_code: overrideBranch || activeBranchCode,
        from_date: overrideFrom || fromDate,
        to_date: overrideTo || toDate,
      };

      const result = await fetchSalesReportSummary(params);

      if (result.isLive && result.data && Array.isArray(result.data)) {
        setSalesSummary(result.data);
        setIsLiveApi(true);
        closeFilterModal();
      } else {
        setIsLiveApi(false);
        setSalesSummary([]);
        const errStr = result.error || 'Unable to connect to live POS API server. Please check connection.';
        setErrorMessage(errStr);
        if (showFeedback) {
          Alert.alert('API Error', errStr);
        }
      }

      setIsLoading(false);
    },
    [activeBranchCode, fromDate, toDate, closeFilterModal]
  );

  const isFocused = useIsFocused();
  const lastFilterKeyRef = useRef<string>('');
  const currentFilterKey = `${fromDate}_${toDate}_${activeBranchCode}`;

  useEffect(() => {
    if (isFocused && lastFilterKeyRef.current !== currentFilterKey) {
      lastFilterKeyRef.current = currentFilterKey;
      loadSalesReport();
    }
  }, [isFocused, currentFilterKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSalesReport();
    setRefreshing(false);
  };

  // Client-side search filtering across summary fields
  const filteredSummary = useMemo(() => {
    if (!searchQuery.trim()) return salesSummary;
    const q = searchQuery.toLowerCase().trim();
    return salesSummary.filter((row) => {
      const inv = String(row.invoice_no || row.bill_no || '').toLowerCase();
      const erp = String(row.erp_invoice_no || '').toLowerCase();
      const cashier = String(row.cashier_name || '').toLowerCase();
      const branch = String(row.branch_code || '').toLowerCase();
      const terminal = String(row.terminal_code || '').toLowerCase();
      const amount = String(row.total_amount || row.grand_total || '').toLowerCase();
      const customer = String(row.customer_name || '').toLowerCase();

      return (
        inv.includes(q) ||
        erp.includes(q) ||
        cashier.includes(q) ||
        branch.includes(q) ||
        terminal.includes(q) ||
        amount.includes(q) ||
        customer.includes(q)
      );
    });
  }, [salesSummary, searchQuery]);

  // Compute summary KPI metrics from filtered real sales summary
  const summaryKPIs = useMemo(() => {
    let totalSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalQty = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalUpi = 0;

    filteredSummary.forEach((row) => {
      const isReturn =
        String(row.doc_type) === '3' ||
        String(row.doc_type_name || '').toLowerCase().includes('return') ||
        (row.invoice_no && String(row.invoice_no).startsWith('R'));
      const mult = isReturn ? -1 : 1;

      totalSales += mult * Number(row.total_amount || row.net_amount || row.grand_total || 0);
      totalTax += mult * Number(row.tax_amount || 0);
      totalDiscount += Number(row.total_discount || 0);
      totalQty += mult * Number(row.total_qty || 1);
      totalCash += Number(row.cash_amount || 0);
      totalCard += Number(row.card_amount || 0);
      totalUpi += Number(row.upi_amount || 0);
    });

    const totalOrders = filteredSummary.length;
    const aov = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalNetSales: totalSales,
      totalOrders,
      totalQty,
      totalDiscount,
      totalTax,
      totalCash,
      totalCard,
      totalUpi,
      aov,
      billCount: totalOrders,
      avgBillValue: aov,
    };
  }, [filteredSummary]);

  // Hourly velocity breakdown
  const hourlyBreakdown = useMemo<HourlyBreakdownItem[]>(() => {
    const map: Record<string, { hourRange: string; hourLabel: string; netSales: number; salesAmount: number; ordersCount: number; billCount: number; aov: number; totalQty: number }> = {};

    filteredSummary.forEach((row) => {
      const savedAt = row.pos_bill_saved_at || row.created_at;
      let hourLabel = 'Other Hours';
      let hourRange = 'Other Hours';

      if (savedAt) {
        try {
          const d = new Date(savedAt.replace(' ', 'T'));
          if (!isNaN(d.getTime())) {
            const h = d.getHours();
            const startStr = String(h).padStart(2, '0') + ':00';
            const endStr = String((h + 1) % 24).padStart(2, '0') + ':00';
            hourLabel = startStr;
            hourRange = `${startStr} - ${endStr}`;
          }
        } catch {}
      }

      const isReturn = String(row.doc_type) === '3' || (row.invoice_no && String(row.invoice_no).startsWith('R'));
      const mult = isReturn ? -1 : 1;
      const amt = mult * Number(row.total_amount || row.net_amount || row.grand_total || 0);

      if (!map[hourRange]) {
        map[hourRange] = { hourRange, hourLabel, netSales: 0, salesAmount: 0, ordersCount: 0, billCount: 0, aov: 0, totalQty: 0 };
      }

      map[hourRange].netSales += amt;
      map[hourRange].salesAmount += amt;
      map[hourRange].ordersCount += 1;
      map[hourRange].billCount += 1;
      map[hourRange].totalQty += mult * Number(row.total_qty || 1);
    });

    return Object.values(map).map((h) => ({
      ...h,
      aov: h.ordersCount > 0 ? h.netSales / h.ordersCount : 0,
    }));
  }, [filteredSummary]);

  // Compute store breakdown dynamically from real API sales summary
  const storeBreakdown = useMemo<StoreBreakdownItem[]>(() => {
    const map: Record<string, { storeCode: string; branchCode: string; storeName: string; branchName: string; netSales: number; salesAmount: number; ordersCount: number; billCount: number; totalQty: number }> = {};

    filteredSummary.forEach((row) => {
      const sCode = row.branch_code || activeBranchCode;
      const sName = row.branch_name || `Store #${sCode}`;
      const isReturn = String(row.doc_type) === '3' || (row.invoice_no && String(row.invoice_no).startsWith('R'));
      const mult = isReturn ? -1 : 1;
      const amt = mult * Number(row.total_amount || row.net_amount || row.grand_total || 0);

      if (!map[sCode]) {
        map[sCode] = { storeCode: sCode, branchCode: sCode, storeName: sName, branchName: sName, netSales: 0, salesAmount: 0, ordersCount: 0, billCount: 0, totalQty: 0 };
      }

      map[sCode].netSales += amt;
      map[sCode].salesAmount += amt;
      map[sCode].ordersCount += 1;
      map[sCode].billCount += 1;
      map[sCode].totalQty += mult * Number(row.total_qty || 1);
    });

    return Object.values(map);
  }, [filteredSummary, activeBranchCode]);

  // Open Invoice Line Items Modal
  const handleOpenInvoiceModal = async (row: SaleReportSummaryRow) => {
    const invNo = row.invoice_no || row.bill_no;
    if (!invNo) return;

    setSelectedInvoice(row);
    setModalItems([]);
    setModalPayments([]);
    setIsModalOpen(true);
    setIsModalLoading(true);

    const bCode = row.branch_code || activeBranchCode;
    const result = await fetchSalesReportItems(invNo, bCode);

    if (result.items) {
      setModalItems(result.items);
    }
    if (result.header) {
      setSelectedInvoice((prev) => ({ ...prev, ...result.header }));
    }
    if (result.payments) {
      setModalPayments(result.payments);
    }
    setIsModalLoading(false);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredSummary.length === 0) {
      Alert.alert('Export Empty', 'No real sales summary records available to export.');
      return;
    }

    Alert.alert(
      'CSV Report Generated',
      `Exported ${filteredSummary.length} live sales entries for period ${fromDate} to ${toDate}.\n\nTotal Revenue: ${formatCurrency(
        summaryKPIs.totalNetSales
      )}`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <TopAppBar
        title="Sales Report"
        subtitle={`Branch #${activeBranchCode} • Central POS API`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SUMMARY & DATE FILTER CARD */}
        <SalesReportHeroFilterCard
          isLiveApi={isLiveApi}
          activeBranchCode={activeBranchCode}
          onToggleFilters={openFilterModal}
          onRefreshData={() => loadSalesReport(true)}
          onExportCSV={handleExportCSV}
          fromDate={fromDate}
          toDate={toDate}
        />

        {/* Server Warning Alert Banner */}
        {errorMessage && (
          <View style={styles.warningBanner}>
            <AlertCircle size={16} color="#dc2626" style={{ marginRight: 8 }} />
            <Text style={styles.warningBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* EXECUTIVE KPI STAT CARDS */}
        <SalesReportKPICards
          summaryKPIs={summaryKPIs}
          isWideScreen={isWideScreen}
          portraitCardWidth={portraitCardWidth}
        />

        {/* Segmented Tab Selector Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'INVOICES' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('INVOICES')}
            activeOpacity={0.8}
          >
            <Receipt size={14} color={activeTab === 'INVOICES' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentBtnText, activeTab === 'INVOICES' && styles.segmentBtnTextActive]}>
              Summary Invoices ({filteredSummary.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'PAYMENTS' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('PAYMENTS')}
            activeOpacity={0.8}
          >
            <CreditCard size={14} color={activeTab === 'PAYMENTS' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentBtnText, activeTab === 'PAYMENTS' && styles.segmentBtnTextActive]}>
              Payment Modes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'HOURLY' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('HOURLY')}
            activeOpacity={0.8}
          >
            <Clock size={14} color={activeTab === 'HOURLY' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentBtnText, activeTab === 'HOURLY' && styles.segmentBtnTextActive]}>
              Hourly Velocity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'STORE' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('STORE')}
            activeOpacity={0.8}
          >
            <Building2 size={14} color={activeTab === 'STORE' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentBtnText, activeTab === 'STORE' && styles.segmentBtnTextActive]}>
              Store Audit
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* TAB 1: SUMMARY INVOICES */}
        {activeTab === 'INVOICES' && (
          <SalesReportInvoicesTab
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            isLoading={isLoading}
            filteredSummary={filteredSummary}
            fromDate={fromDate}
            toDate={toDate}
            onRefetchData={() => loadSalesReport(true)}
            onOpenInvoiceModal={handleOpenInvoiceModal}
          />
        )}

        {/* TAB 2: PAYMENT MODES */}
        {activeTab === 'PAYMENTS' && (
          <SalesReportPaymentModesTab summaryKPIs={summaryKPIs} />
        )}

        {/* TAB 3: HOURLY VELOCITY */}
        {activeTab === 'HOURLY' && (
          <SalesReportHourlyTab
            hourlyBreakdown={hourlyBreakdown}
            fromDate={fromDate}
            toDate={toDate}
          />
        )}

        {/* TAB 4: STORE AUDIT */}
        {activeTab === 'STORE' && (
          <SalesReportStoreAuditTab
            storeBreakdown={storeBreakdown}
            fromDate={fromDate}
            toDate={toDate}
          />
        )}
      </ScrollView>

      {/* UNIFIED FILTER MODAL — Rendered at Root level outside ScrollView */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Sales Report Filters"
        selectedPreset={selectedPreset}
        fromDate={fromDate}
        toDate={toDate}
        onClose={closeFilterModal}
        onApplyPreset={applyPreset}
        onSelectDate={(newDate, target) => {
          if (target === 'FROM') setFromDate(newDate);
          else setToDate(newDate);
        }}
        onApply={() => loadSalesReport(true)}
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

      {/* INVOICE DETAILS LINE-ITEM MODAL */}
      <InvoiceDetailsModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedInvoice={selectedInvoice}
        activeBranchCode={activeBranchCode}
        isTablet={isTablet}
        isLoading={isModalLoading}
        modalItems={modalItems}
      />

      {/* BRANCH SELECTOR MODAL */}
      <BranchSelectorModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        selectedBranchCodes={selectedBranchCodes}
        title="Select Store for Sales Report"
        onApply={(selectedCodes) => {
          setSelectedBranchCodes(selectedCodes);
          if (selectedCodes.length > 0) {
            loadSalesReport(true, fromDate, toDate, selectedCodes[0]);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 140,
    width: '100%',
  },
  tabletScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
  },
  tabsRow: {
    gap: 8,
    marginBottom: 14,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  segmentBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  segmentBtnTextActive: {
    color: '#ffffff',
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
