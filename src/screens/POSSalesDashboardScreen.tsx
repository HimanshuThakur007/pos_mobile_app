import React, { useState, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import {
  FileText,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Store,
  DollarSign,
  Activity,
  Layers,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  ClipboardList,
  Users,
} from 'lucide-react-native';
import { fetchBillComparison, fetchErpPosComparison, fetchBranches, BranchItem } from '../api/comparisonApi';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import { UnifiedFilterModal } from '../components/common/UnifiedFilterModal';
import { StoreSelectionTriggerBadge } from '../components/common/StoreSelectionTriggerBadge';
import { BranchSelectorModal } from '../components/modals/BranchSelectorModal';

// ─── helpers ────────────────────────────────────────────────────────────────
const getTodayStr = () => new Date().toISOString().split('T')[0];

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtLakh = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString('en-IN')}`;

// ─── KPI Tile ────────────────────────────────────────────────────────────────
interface KPITileProps {
  label: string;
  value: string;
  badge?: string;
  badgeGood?: boolean;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: string;
  onPress?: () => void;
}
const KPITile: React.FC<KPITileProps> = ({ label, value, badge, badgeGood = true, icon: Icon, accent, onPress }) => {
  const { theme, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.kpiTile, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Left accent strip */}
      <View style={[styles.kpiAccentStrip, { backgroundColor: accent }]} />

      {/* Icon bubble */}
      <View style={[styles.kpiIconWrap, { backgroundColor: `${accent}18` }]}>
        <Icon size={20} color={accent} />
      </View>

      {/* Text content */}
      <View style={styles.kpiTextCol}>
        <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.kpiValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {value}
        </Text>
        {badge ? (
          <View style={[styles.kpiBadge, {
            backgroundColor: badgeGood ? (isDark ? '#064e3b' : '#d1fae5') : (isDark ? '#7f1d1d' : '#fee2e2'),
          }]}>
            <Text style={[styles.kpiBadgeText, {
              color: badgeGood ? (isDark ? '#6ee7b7' : '#065f46') : (isDark ? '#fca5a5' : '#991b1b'),
            }]}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// ─── Channel Row ─────────────────────────────────────────────────────────────
interface ChannelRowProps { label: string; value: number; total: number; color: string; }
const ChannelRow: React.FC<ChannelRowProps> = ({ label, value, total, color }) => {
  const { theme } = useTheme();
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.channelRow}>
      <Text style={[styles.channelRowLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.channelBarTrack, { backgroundColor: theme.divider }]}>
        <View style={[styles.channelBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.channelRowValue, { color: theme.textPrimary }]}>{value.toLocaleString('en-IN')}</Text>
    </View>
  );
};

// ─── Status Pill ─────────────────────────────────────────────────────────────
interface StatusPillProps {
  label: string; value: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  bg: string; fg: string;
}
const StatusPill: React.FC<StatusPillProps> = ({ label, value, icon: Icon, bg, fg }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.statusPill, { backgroundColor: bg, borderColor: `${fg}33` }]}>
      <Icon size={14} color={fg} />
      <Text style={[styles.statusPillVal, { color: fg }]}>{value}</Text>
      <Text style={[styles.statusPillLbl, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string; subtitle?: string; onAction?: () => void; actionLabel?: string;
  accent?: string; icon: React.ComponentType<{ size?: number; color?: string }>;
}
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, onAction, actionLabel, accent = '#1877f2', icon: Icon }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionIconWrap, { backgroundColor: `${accent}18` }]}>
        <Icon size={15} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {onAction ? (
        <TouchableOpacity style={styles.sectionActionBtn} onPress={onAction}>
          <Text style={[styles.sectionActionText, { color: accent }]}>{actionLabel ?? 'View'}</Text>
          <ArrowUpRight size={13} color={accent} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ─── Quick Action Button ──────────────────────────────────────────────────────
interface QuickActionProps {
  label: string; icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: string; onPress?: () => void;
}
const QuickActionBtn: React.FC<QuickActionProps> = ({ label, icon: Icon, accent, onPress }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.quickBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
      onPress={onPress} activeOpacity={0.75}
    >
      <View style={[styles.quickBtnIcon, { backgroundColor: `${accent}18` }]}>
        <Icon size={18} color={accent} />
      </View>
      <Text style={[styles.quickBtnLabel, { color: theme.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export const POSSalesDashboardScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const isLandscape = width > height && width >= 700;

  // Global filter state
  const {
    fromDate,
    toDate,
    selectedPreset,
    selectedBranchCodes,
    isFilterModalOpen,
    closeFilterModal,
    setFromDate,
    setToDate,
    applyPreset,
    resetFilters,
    setSelectedBranchCodes,
  } = useGlobalFilter();

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Summary state for dashboard widgets
  const [billSummaryStats, setBillSummaryStats] = useState({
    totalStores: 18,
    totalBills: 14820,
    totalRevenue: 8459200,
    desktopCount: 4210,
    posCount: 6850,
    centralCount: 11060,
    erpCount: 11055,
    matchedCount: 17,
    discrepancyCount: 1,
  });

  const [erpPosSummaryStats, setErpPosSummaryStats] = useState({
    matched: 791,
    mismatched: 0,
    missingInErp: 0,
    missingInPos: 2,
    totalInvoices: 793,
    syncHealthPercent: 99.7,
  });

  // Load available branches on mount
  useEffect(() => {
    fetchBranches()
      .then((res) => {
        if (res.data) setBranches(res.data);
      })
      .catch(() => {});
  }, []);

  const loadDashboardData = async (
    fDate = fromDate,
    tDate = toDate,
    bCodes = selectedBranchCodes
  ) => {
    try {
      const billRes = await fetchBillComparison({ from: fDate, to: tDate }).catch(() => null);
      if (billRes?.data && Array.isArray(billRes.data) && billRes.data.length > 0) {
        const rawStores = billRes.data;
        const stores = bCodes.length > 0
          ? rawStores.filter((i: any) => bCodes.includes(String(i.branch_code)))
          : rawStores;
        const totDesktop = stores.reduce((s: number, i: any) => s + (i.desktop_app_count || 0), 0);
        const totPos = stores.reduce((s: number, i: any) => s + (i.pos_count || 0), 0);
        const totCentral = stores.reduce((s: number, i: any) => s + (i.central_count || 0), 0);
        const totErp = stores.reduce((s: number, i: any) => s + (i.erp_count || 0), 0);
        const totRev = stores.reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
        const disc = stores.filter((i: any) => i.central_count !== i.erp_count).length;

        setBillSummaryStats({
          totalStores: stores.length,
          totalBills: totCentral,
          totalRevenue: totRev,
          desktopCount: totDesktop,
          posCount: totPos,
          centralCount: totCentral,
          erpCount: totErp,
          matchedCount: stores.length - disc,
          discrepancyCount: disc,
        });
      }

      const branchParam = bCodes.length > 0 ? bCodes.join(',') : user?.branchCode || '5010';
      const erpRes = await fetchErpPosComparison({
        from_date: fDate,
        to_date: tDate,
        branch_code: branchParam,
      }).catch(() => null);
      if (erpRes?.summary) {
        const { matched = 0, mismatched = 0, missing_in_erp = 0, missing_in_pos = 0 } = erpRes.summary;
        const total = matched + mismatched + missing_in_erp + missing_in_pos;
        const syncPercent = total > 0 ? Number(((matched / total) * 100).toFixed(1)) : 100;

        setErpPosSummaryStats({
          matched,
          mismatched,
          missingInErp: missing_in_erp,
          missingInPos: missing_in_pos,
          totalInvoices: total,
          syncHealthPercent: syncPercent,
        });
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.log('Error loading dashboard:', e);
    }
  };

  const isFocused = useIsFocused();
  const lastFilterKeyRef = useRef<string>('');
  const currentFilterKey = `${fromDate}_${toDate}_${selectedBranchCodes.join(',')}`;

  useEffect(() => {
    if (isFocused && lastFilterKeyRef.current !== currentFilterKey) {
      lastFilterKeyRef.current = currentFilterKey;
      loadDashboardData();
    }
  }, [isFocused, currentFilterKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const syncGood = erpPosSummaryStats.syncHealthPercent >= 99;
  const billMaxCount = Math.max(
    billSummaryStats.desktopCount,
    billSummaryStats.posCount,
    billSummaryStats.centralCount,
    billSummaryStats.erpCount,
    1,
  );
  const lastRefreshLabel = lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <TopAppBar
        title="Reconciliation"
        subtitle="Audit Control Center"
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isLandscape && styles.landscapeScrollContent]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Date & Refresh Strip ── */}
        <View style={[styles.dateStrip, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.datePill}>
            <View style={[styles.dateDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.dateStripText, { color: theme.textPrimary }]}>
              {fmtDate(fromDate)}{fromDate !== toDate ? ` — ${fmtDate(toDate)}` : '  ·  Today'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <RefreshCw size={13} color={theme.textSecondary} />
            <Text style={[styles.refreshLabel, { color: theme.textSecondary }]}>{lastRefreshLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* ── KPI Grid — 2 rows × 2 columns ── */}
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <KPITile
              label="Audited Revenue"
              value={fmtLakh(billSummaryStats.totalRevenue)}
              badge="+12.4%"
              badgeGood
              icon={DollarSign}
              accent="#137333"
              onPress={() => navigation?.navigate('BillComparison')}
            />
            <KPITile
              label="Sync Health"
              value={`${erpPosSummaryStats.syncHealthPercent}%`}
              badge={syncGood ? 'Optimal' : 'Review'}
              badgeGood={syncGood}
              icon={ShieldCheck}
              accent="#1877f2"
              onPress={() => navigation?.navigate('ErpPosComparison')}
            />
          </View>
          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <KPITile
              label="Active Stores"
              value={`${billSummaryStats.totalStores}`}
              badge={billSummaryStats.discrepancyCount > 0 ? `${billSummaryStats.discrepancyCount} Alert` : 'All Clear'}
              badgeGood={billSummaryStats.discrepancyCount === 0}
              icon={Store}
              accent="#8b5cf6"
              onPress={() => navigation?.navigate('BillComparison')}
            />
            <KPITile
              label="Reconciled Bills"
              value={`${erpPosSummaryStats.matched}/${erpPosSummaryStats.totalInvoices}`}
              badge="99.7% Match"
              badgeGood
              icon={CheckCircle2}
              accent="#0ea5e9"
              onPress={() => navigation?.navigate('ErpPosComparison')}
            />
          </View>
        </View>

        {/* ── Bill Comparison Card ── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <SectionHeader
            title="Store Bill Comparison"
            subtitle={`${billSummaryStats.totalStores} branches · ${billSummaryStats.totalBills.toLocaleString('en-IN')} total bills`}
            icon={FileText}
            accent="#1877f2"
            onAction={() => navigation?.navigate('BillComparison')}
            actionLabel="View All"
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.channelList}>
            <ChannelRow label="Desktop App"  value={billSummaryStats.desktopCount}  total={billMaxCount} color="#1877f2" />
            <ChannelRow label="POS Terminal" value={billSummaryStats.posCount}      total={billMaxCount} color="#8b5cf6" />
            <ChannelRow label="Central Sync" value={billSummaryStats.centralCount}  total={billMaxCount} color="#0ea5e9" />
            <ChannelRow label="ERP Ledger"   value={billSummaryStats.erpCount}      total={billMaxCount} color="#137333" />
          </View>
          <View style={[styles.billSummaryRow, { borderTopColor: theme.divider }]}>
            <View style={styles.billSummaryItem}>
              <CheckCircle2 size={14} color="#137333" />
              <Text style={[styles.billSummaryVal, { color: '#137333' }]}>{billSummaryStats.matchedCount}</Text>
              <Text style={[styles.billSummaryLbl, { color: theme.textSecondary }]}>Stores OK</Text>
            </View>
            <View style={[styles.billSummaryDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.billSummaryItem}>
              <AlertTriangle size={14} color={billSummaryStats.discrepancyCount > 0 ? '#c5221f' : '#137333'} />
              <Text style={[styles.billSummaryVal, { color: billSummaryStats.discrepancyCount > 0 ? '#c5221f' : '#137333' }]}>
                {billSummaryStats.discrepancyCount}
              </Text>
              <Text style={[styles.billSummaryLbl, { color: theme.textSecondary }]}>Discrepancies</Text>
            </View>
            <View style={[styles.billSummaryDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.billSummaryItem}>
              <TrendingUp size={14} color="#1877f2" />
              <Text style={[styles.billSummaryVal, { color: '#1877f2' }]}>{fmtLakh(billSummaryStats.totalRevenue)}</Text>
              <Text style={[styles.billSummaryLbl, { color: theme.textSecondary }]}>Revenue</Text>
            </View>
          </View>
        </View>

        {/* ── ERP vs POS Card ── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <SectionHeader
            title="ERP vs POS Reconciliation"
            subtitle={`${erpPosSummaryStats.totalInvoices} invoices · ${erpPosSummaryStats.syncHealthPercent}% sync health`}
            icon={GitCompare}
            accent="#137333"
            onAction={() => navigation?.navigate('ErpPosComparison')}
            actionLabel="View All"
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.syncBarWrap}>
            <View style={styles.syncBarHeader}>
              <Text style={[styles.syncBarLabel, { color: theme.textSecondary }]}>Sync Health Score</Text>
              <Text style={[styles.syncBarPct, { color: syncGood ? '#137333' : '#c5221f' }]}>
                {erpPosSummaryStats.syncHealthPercent}%
              </Text>
            </View>
            <View style={[styles.syncBarTrack, { backgroundColor: theme.divider }]}>
              <View style={[styles.syncBarFill, {
                width: `${erpPosSummaryStats.syncHealthPercent}%`,
                backgroundColor: syncGood ? '#137333' : '#c5221f',
              }]} />
            </View>
          </View>
          <View style={styles.statusPillGrid}>
            <StatusPill label="Matched"     value={erpPosSummaryStats.matched}      icon={CheckCircle2}  bg={isDark ? '#064e3b' : '#e6f4ea'} fg={isDark ? '#6ee7b7' : '#137333'} />
            <StatusPill label="Mismatched"  value={erpPosSummaryStats.mismatched}   icon={AlertTriangle} bg={isDark ? '#7f1d1d' : '#fce8e6'} fg={isDark ? '#fca5a5' : '#c5221f'} />
            <StatusPill label="Missing ERP" value={erpPosSummaryStats.missingInErp} icon={HelpCircle}    bg={isDark ? '#78350f' : '#fef3c7'} fg={isDark ? '#fde047' : '#b45309'} />
            <StatusPill label="Missing POS" value={erpPosSummaryStats.missingInPos} icon={Layers}        bg={isDark ? '#1e3a8a' : '#e7f3ff'} fg={isDark ? '#93c5fd' : '#1877f2'} />
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={[styles.quickActionsHeading, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsRow}>
          <QuickActionBtn label="Reports"   icon={Activity}      accent="#b45309" onPress={() => navigation?.navigate('Reports')} />
          <QuickActionBtn label="Cashier"   icon={Users}         accent="#8b5cf6" onPress={() => navigation?.navigate('Cashier')} />
          <QuickActionBtn label="Inventory" icon={ClipboardList} accent="#0ea5e9" onPress={() => navigation?.navigate('Inventory')} />
          <QuickActionBtn label="Settings"  icon={ShieldCheck}   accent="#475569" onPress={() => navigation?.navigate('Settings')} />
        </View>

      </ScrollView>

      {/* UNIFIED FILTER MODAL */}
      <UnifiedFilterModal
        visible={isFilterModalOpen}
        title="Reconciliation Dashboard Filters"
        selectedPreset={selectedPreset}
        fromDate={fromDate}
        toDate={toDate}
        onClose={closeFilterModal}
        onApplyPreset={applyPreset}
        onSelectDate={(newDate: string, target: 'FROM' | 'TO') => {
          if (target === 'FROM') setFromDate(newDate);
          else setToDate(newDate);
        }}
        onApply={() => loadDashboardData(fromDate, toDate, selectedBranchCodes)}
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
          loadDashboardData(fromDate, toDate, newCodes);
        }}
        title="Select Stores to Audit"
      />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 120 },
  landscapeScrollContent: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 120 },

  // Date strip
  dateStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateDot: { width: 8, height: 8, borderRadius: 4 },
  dateStripText: { fontSize: 13, fontWeight: '700' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  refreshLabel: { fontSize: 11, fontWeight: '600' },

  // KPI grid — explicit rows
  kpiGrid: { gap: 10, marginBottom: 14 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingRight: 12,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  kpiAccentStrip: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginLeft: -1 },
  kpiIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiTextCol: { flex: 1, gap: 2 },
  kpiValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  kpiLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  kpiBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20, marginTop: 2 },
  kpiBadgeText: { fontSize: 9, fontWeight: '800' },

  // Section card
  sectionCard: {
    borderRadius: 16, borderWidth: 1, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  divider: { height: 1, marginHorizontal: 14, marginBottom: 12 },

  // Section header
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 12 },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  sectionSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  sectionActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  sectionActionText: { fontSize: 12, fontWeight: '700' },

  // Channel rows
  channelList: { paddingHorizontal: 14, gap: 10, marginBottom: 14 },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  channelRowLabel: { width: 90, fontSize: 12, fontWeight: '600' },
  channelBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  channelBarFill: { height: 6, borderRadius: 3 },
  channelRowValue: { width: 60, fontSize: 12, fontWeight: '700', textAlign: 'right' },

  // Bill summary footer
  billSummaryRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  billSummaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  billSummaryVal: { fontSize: 15, fontWeight: '800' },
  billSummaryLbl: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.2 },
  billSummaryDivider: { width: 1, height: '80%', alignSelf: 'center' },

  // Sync health bar
  syncBarWrap: { paddingHorizontal: 14, marginBottom: 12, gap: 6 },
  syncBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  syncBarLabel: { fontSize: 12, fontWeight: '600' },
  syncBarPct: { fontSize: 13, fontWeight: '800' },
  syncBarTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  syncBarFill: { height: 8, borderRadius: 4 },

  // Status pills
  statusPillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  statusPill: { width: '47%', borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  statusPillVal: { fontSize: 20, fontWeight: '800' },
  statusPillLbl: { fontSize: 11, fontWeight: '600' },

  // Quick actions
  quickActionsHeading: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  quickActionsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  quickBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1, alignItems: 'center', paddingVertical: 12, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  quickBtnIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickBtnLabel: { fontSize: 11, fontWeight: '700' },
});
