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
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { BranchSelectorModal } from '../components/modals/BranchSelectorModal';
import {
  fetchStoreSalesPeriodComparison,
  StoreSalesPeriodComparisonItem,
  StoreSalesPeriodComparisonMeta,
  StoreSalesPeriodComparisonTotals,
  PeriodComparisonType,
  formatDateRangeText,
} from '../api/storeSalesPeriodComparisonApi';
import { fetchBranches, BranchItem } from '../api/comparisonApi';
import { formatCurrency, getStoreFilterLabel } from '../utils/formatters';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import {
  Calendar,
  CalendarRange,
  Clock,
  Search,
  X,
  Store,
  TrendingUp,
  Award,
  Sparkles,
  Building2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react-native';

const PERIOD_OPTIONS: {
  id: PeriodComparisonType;
  label: string;
  curLabel: string;
  prevLabel: string;
  icon: any;
}[] = [
  {
    id: 'month_vs_month',
    label: 'Month vs Month',
    curLabel: 'This Month',
    prevLabel: 'Last Month',
    icon: Calendar,
  },
  {
    id: 'week_vs_week',
    label: 'Week vs Week',
    curLabel: 'This Week',
    prevLabel: 'Last Week',
    icon: CalendarRange,
  },
  {
    id: 'today_vs_yesterday',
    label: 'Today vs Yesterday',
    curLabel: 'Today',
    prevLabel: 'Yesterday',
    icon: Clock,
  },
];

export const SalesPeriodComparisonScreen: React.FC<{ navigation?: any }> = () => {
  const { theme, isDark } = useTheme();

  // ── Global Filter Context ───────────────────────────────────────────────
  const { selectedBranchCodes, setSelectedBranchCodes } = useGlobalFilter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodComparisonType>('month_vs_month');
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  const [records, setRecords] = useState<StoreSalesPeriodComparisonItem[]>([]);
  const [totals, setTotals] = useState<StoreSalesPeriodComparisonTotals>({
    total_current_net_sales: 0,
    total_previous_net_sales: 0,
    total_growth_amount: 0,
    total_growth_pct: 0,
    total_stores: 0,
    growing_stores: 0,
    declining_stores: 0,
    top_gainer: null,
    top_decliner: null,
  });
  const [meta, setMeta] = useState<StoreSalesPeriodComparisonMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // ── Branches ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBranches().then((res) => {
      if (res.data?.length) setBranches(res.data);
    });
  }, []);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(
    async (overridePeriod?: PeriodComparisonType, overrideBranches?: string[]) => {
      setIsLoading(true);
      setErrorMessage(null);
      const period = overridePeriod || selectedPeriod;
      const codes = overrideBranches !== undefined ? overrideBranches : selectedBranchCodes;
      const res = await fetchStoreSalesPeriodComparison({
        period,
        branch_code: codes.length ? codes.join(',') : undefined,
      });
      if (res.isLive) {
        setRecords(res.data);
        setTotals(res.totals);
        setMeta(res.meta);
      } else {
        setRecords([]);
        setErrorMessage(res.error || 'Failed to fetch comparison data.');
      }
      setIsLoading(false);
    },
    [selectedPeriod, selectedBranchCodes]
  );

  const isFocused = useIsFocused();
  const lastFilterKeyRef = useRef<string>('');
  const currentFilterKey = `${selectedPeriod}_${selectedBranchCodes.join(',')}`;

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

  const handlePeriodChange = (p: PeriodComparisonType) => {
    setSelectedPeriod(p);
    loadData(p);
  };

  // ── Filtered records ───────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return records;
    return records.filter(
      (r) =>
        String(r.branch_name || '').toLowerCase().includes(q) ||
        String(r.branch_code || '').toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  // ── Derived period & date info ─────────────────────────────────────────────
  const periodOption = PERIOD_OPTIONS.find((p) => p.id === selectedPeriod)!;
  const storeLbl = getStoreFilterLabel(selectedBranchCodes, branches);
  const isOverallUp = totals.total_growth_pct >= 0;

  const curDateRangeStr = meta ? formatDateRangeText(meta.current_range) : '—';
  const prevDateRangeStr = meta ? formatDateRangeText(meta.previous_range) : '—';

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      {/* Top App Bar */}
      <TopAppBar
        title="Sales Period Comparison"
        subtitle={`${periodOption.label} • ${storeLbl}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
        onOpenFilter={() => setIsBranchModalOpen(true)}
      />

      {/* Control Bar & Search (Matches Branch Sale Ranking bar design) */}
      <View style={[styles.controlBar, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.storeChip, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => setIsBranchModalOpen(true)}
          activeOpacity={0.7}
        >
          <Building2 size={12} color={theme.primary} />
          <Text style={[styles.storeChipText, { color: theme.textPrimary }]} numberOfLines={1}>
            {storeLbl}
          </Text>
        </TouchableOpacity>

        {/* Date Badge Pill right near All Stores chip (like Branch Sale ranking) */}
        <View style={[styles.dateContextPill, { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: theme.border }]}>
          <Calendar size={11} color={theme.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.dateContextPillText, { color: theme.textPrimary }]} numberOfLines={1}>
            {curDateRangeStr}
          </Text>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search store code or name..."
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

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => loadData()}
          activeOpacity={0.7}
        >
          <RefreshCw size={13} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Selector Segment Control */}
      <View style={[styles.periodBarContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        {PERIOD_OPTIONS.map((opt) => {
          const active = selectedPeriod === opt.id;
          const Icon = opt.icon;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.periodTabItem,
                active && [styles.activePeriodTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
              ]}
              onPress={() => handlePeriodChange(opt.id)}
              activeOpacity={0.8}
            >
              <Icon size={12} color={active ? theme.primary : theme.textMuted} />
              <Text
                style={[
                  styles.periodTabText,
                  { color: active ? theme.textPrimary : theme.textMuted },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        {/* API Date Card - Displays ONLY the dates coming from API */}
        <View style={[styles.dateCardBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
          <View style={styles.dateCardRow}>
            <View style={[styles.datePill, { backgroundColor: isDark ? '#064e3b33' : '#dcfce7', borderColor: isDark ? '#065f46' : '#a7f3d0' }]}>
              <Calendar size={12} color="#059669" />
              <Text style={[styles.datePillValue, { color: isDark ? '#6ee7b7' : '#065f46' }]}>
                {curDateRangeStr}
              </Text>
            </View>

            <View style={[styles.datePill, { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderColor: isDark ? '#1e40af' : '#bfdbfe' }]}>
              <Clock size={12} color="#1d4ed8" />
              <Text style={[styles.datePillValue, { color: isDark ? '#93c5fd' : '#1e3a8a' }]}>
                {prevDateRangeStr}
              </Text>
            </View>
          </View>
        </View>

        {/* Executive KPI Summary Cards Strip (Matching Day Wise Store Sale) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginVertical: 4 }}>
          <View style={styles.kpiWrap}>
            {/* Card 1: Current Net Sales */}
            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#ecfdf5', borderColor: '#a7f3d0' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#d1fae5' }]}>
                <TrendingUp size={14} color="#059669" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#047857' }]}>{periodOption.curLabel.toUpperCase()} SALE</Text>
                <Text style={[styles.kValue, { color: '#065f46' }]}>
                  {formatCurrency(totals.total_current_net_sales)}
                </Text>
                <Text style={[styles.kSub, { color: '#047857' }]}>{curDateRangeStr}</Text>
              </View>
            </View>

            {/* Card 2: Previous Net Sales */}
            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#bfdbfe' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#dbeafe' }]}>
                <Store size={14} color="#1d4ed8" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#1e40af' }]}>{periodOption.prevLabel.toUpperCase()} SALE</Text>
                <Text style={[styles.kValue, { color: '#1e3a8a' }]}>
                  {formatCurrency(totals.total_previous_net_sales)}
                </Text>
                <Text style={[styles.kSub, { color: '#1e40af' }]}>{prevDateRangeStr}</Text>
              </View>
            </View>

            {/* Card 3: Net Growth */}
            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : (isOverallUp ? '#f0fdf4' : '#fef2f2'), borderColor: isOverallUp ? '#bbf7d0' : '#fecaca' }]}>
              <View style={[styles.iconWrap, { backgroundColor: isOverallUp ? '#dcfce7' : '#fee2e2' }]}>
                <Award size={14} color={isOverallUp ? '#16a34a' : '#dc2626'} />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: isOverallUp ? '#15803d' : '#991b1b' }]}>GROWTH VARIANCE</Text>
                <Text style={[styles.kValue, { color: isOverallUp ? '#166534' : '#991b1b' }]}>
                  {isOverallUp ? '+' : ''}{totals.total_growth_pct.toFixed(1)}%
                </Text>
                <Text style={[styles.kSub, { color: isOverallUp ? '#15803d' : '#991b1b' }]}>
                  {totals.total_growth_amount >= 0 ? '+' : ''}{formatCurrency(totals.total_growth_amount)}
                </Text>
              </View>
            </View>

            {/* Card 4: Store Health */}
            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#fff7ed', borderColor: '#fed7aa' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#ffedd5' }]}>
                <Sparkles size={14} color="#c55a11" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#c55a11' }]}>STORE HEALTH</Text>
                <Text style={[styles.kValue, { color: '#9a3412' }]}>
                  {totals.growing_stores} ↑  {totals.declining_stores} ↓
                </Text>
                <Text style={[styles.kSub, { color: '#c55a11' }]}>
                  of {totals.total_stores} total stores
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Content Section: STORE CARDS MATRIX */}
        {isLoading && records.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.centerText, { color: theme.textSecondary }]}>
              Loading sales period comparison & API date metrics...
            </Text>
          </View>
        ) : errorMessage && records.length === 0 ? (
          <View style={styles.centerBox}>
            <AlertTriangle size={32} color={isDark ? '#f87171' : '#dc2626'} style={{ marginBottom: 8 }} />
            <Text style={[styles.centerTitle, { color: theme.textPrimary }]}>Failed to Load Data</Text>
            <Text style={[styles.centerText, { color: theme.textSecondary }]}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={() => loadData()}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>Retry API Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsList}>
            <Text style={[styles.listHeaderTitle, { color: theme.textSecondary }]}>
              STORE PERIOD COMPARISON MATRIX ({filteredRecords.length})
            </Text>

            {filteredRecords.map((item, idx) => {
              const isUp = item.growth_pct > 0;
              const isFlat = item.growth_pct === 0;

              const growthPillBg = isUp
                ? (isDark ? '#052e16' : '#dcfce7')
                : isFlat
                ? (isDark ? '#1e293b' : '#f1f5f9')
                : (isDark ? '#2d0a0a' : '#fee2e2');

              const growthPillTextColor = isUp
                ? (isDark ? '#4ade80' : '#16a34a')
                : isFlat
                ? theme.textSecondary
                : (isDark ? '#f87171' : '#dc2626');

              const maxVal = Math.max(item.current_net_sales, item.previous_net_sales, 1);
              const curBarPct = Math.min(100, Math.max(3, (item.current_net_sales / maxVal) * 100));

              return (
                <View
                  key={String(item.branch_code)}
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
                          {item.branch_name}
                        </Text>

                        {/* Store Code & Date Badge right near store name (Branch Sale ranking style) */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          <Text style={[styles.storeMetaText, { color: theme.textMuted }]}>
                            Code: {item.branch_code}
                          </Text>
                          <View style={[styles.dateContextPill, { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: theme.border }]}>
                            <Calendar size={10} color={theme.primary} style={{ marginRight: 3 }} />
                            <Text style={[styles.storeDateBadgeText, { color: theme.textPrimary }]}>
                              {curDateRangeStr}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.achPill, { backgroundColor: growthPillBg }]}>
                      <Text style={[styles.achPillText, { color: growthPillTextColor }]}>
                        {isUp ? '+' : ''}{item.growth_pct.toFixed(1)}% Growth
                      </Text>
                    </View>
                  </View>

                  {/* Visual Bar Indicator */}
                  <View style={{ marginTop: 10, marginBottom: 10 }}>
                    <View style={[styles.barTrack, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${curBarPct}%`,
                            backgroundColor: growthPillTextColor,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* 2x2 Metrics Grid */}
                  <View style={[styles.metricsGrid, { backgroundColor: isDark ? '#1e293b33' : '#f8fafc', borderColor: theme.border }]}>
                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>Current Sales ({curDateRangeStr.split('–')[0]?.trim() || ''})</Text>
                      <Text style={[styles.mVal, { color: theme.primary }]}>{formatCurrency(item.current_net_sales)}</Text>
                    </View>

                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>Previous Sales ({prevDateRangeStr.split('–')[0]?.trim() || ''})</Text>
                      <Text style={[styles.mVal, { color: theme.textSecondary }]}>{formatCurrency(item.previous_net_sales)}</Text>
                    </View>

                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>Growth Variance</Text>
                      <Text style={[styles.mVal, { color: growthPillTextColor }]}>
                        {item.growth_amount >= 0 ? '+' : ''}{formatCurrency(item.growth_amount)}
                      </Text>
                    </View>

                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>Growth Percentage</Text>
                      <Text style={[styles.mVal, { color: growthPillTextColor }]}>
                        {isUp ? '+' : ''}{item.growth_pct.toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  {/* Representable Table Box */}
                  <View style={[styles.dailyTableBox, { borderColor: theme.border }]}>
                    <View style={[styles.dailyTableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Text style={[styles.dailyThText, { color: theme.textSecondary, flex: 1.2 }]}>PERIOD</Text>
                      <Text style={[styles.dailyThText, { color: theme.textSecondary, flex: 2.2 }]}>API DATE RANGE</Text>
                      <Text style={[styles.dailyThText, { color: theme.textSecondary, flex: 1.6, textAlign: 'right' }]}>NET SALE</Text>
                    </View>

                    {/* Current Period Row */}
                    <View style={[styles.dailyTableRow, { backgroundColor: isDark ? '#1e293b11' : '#ffffff', borderBottomColor: theme.border }]}>
                      <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={[styles.badgeDot, { backgroundColor: theme.primary }]} />
                        <Text style={[styles.dailyTdDate, { color: theme.textPrimary }]}>
                          {periodOption.curLabel}
                        </Text>
                      </View>
                      <Text style={[styles.dailyTdDateSub, { color: theme.primary, flex: 2.2 }]}>
                        {curDateRangeStr}
                      </Text>
                      <Text style={[styles.dailyTdVal, { color: theme.primary, flex: 1.6, textAlign: 'right' }]}>
                        {formatCurrency(item.current_net_sales)}
                      </Text>
                    </View>

                    {/* Previous Period Row */}
                    <View style={[styles.dailyTableRow, { backgroundColor: isDark ? '#1e293b11' : '#ffffff', borderBottomColor: theme.border }]}>
                      <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={[styles.badgeDot, { backgroundColor: isDark ? '#64748b' : '#94a3b8' }]} />
                        <Text style={[styles.dailyTdDate, { color: theme.textSecondary }]}>
                          {periodOption.prevLabel}
                        </Text>
                      </View>
                      <Text style={[styles.dailyTdDateSub, { color: theme.textMuted, flex: 2.2 }]}>
                        {prevDateRangeStr}
                      </Text>
                      <Text style={[styles.dailyTdVal, { color: theme.textSecondary, flex: 1.6, textAlign: 'right' }]}>
                        {formatCurrency(item.previous_net_sales)}
                      </Text>
                    </View>

                    {/* Footer Summary Row */}
                    <View style={[styles.dailyTableRow, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderBottomWidth: 0, paddingVertical: 8 }]}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: theme.primary, flex: 1.2 }}>
                        GROWTH
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: growthPillTextColor, flex: 2.2 }}>
                        {isUp ? '+' : ''}{item.growth_pct.toFixed(1)}% Variance
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: growthPillTextColor, flex: 1.6, textAlign: 'right' }}>
                        {item.growth_amount >= 0 ? '+' : ''}{formatCurrency(item.growth_amount)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Branch Selector Modal */}
      <BranchSelectorModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        selectedBranchCodes={selectedBranchCodes}
        onApply={(newCodes) => {
          setSelectedBranchCodes(newCodes);
          setIsBranchModalOpen(false);
          loadData(selectedPeriod, newCodes);
        }}
        title="Select Stores for Period Comparison"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Control Bar (Matches Branch Sales Ranking top filter bar style)
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 110,
  },
  storeChipText: { fontSize: 11, fontWeight: '800' },
  dateContextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  dateContextPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  searchInput: { flex: 1, fontSize: 11, paddingVertical: 0 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Period Segment Switcher Bar
  periodBarContainer: {
    flexDirection: 'row',
    padding: 3,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    gap: 4,
  },
  periodTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activePeriodTabItem: {
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  periodTabText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  // API Date Card Box - Clean Display of ONLY API dates
  dateCardBox: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateCardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  datePillValue: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  // KPI Cards Strip
  kpiWrap: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 140,
  },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kLabel: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.3 },
  kValue: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  kSub: { fontSize: 9, fontWeight: '600', marginTop: 1 },

  // Cards List
  cardsList: { paddingHorizontal: 12, gap: 12, marginTop: 8 },
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
  storeMetaText: { fontSize: 10 },
  storeDateBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
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
  dailyTableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'space-between' },
  dailyThText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  dailyTableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  dailyTdDate: { fontSize: 10.5, fontWeight: '700' },
  dailyTdDateSub: { fontSize: 10, fontWeight: '600' },
  dailyTdVal: { fontSize: 11, fontWeight: '800' },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },

  // Centered States
  centerBox: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  centerText: {
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
