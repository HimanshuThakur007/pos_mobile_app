import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';
import {
  Calendar,
  Search,
  X,
  Store,
  TrendingUp,
  Award,
  Sparkles,
  CalendarCheck,
  Table,
  Layers,
} from 'lucide-react-native';

interface DayConfig {
  dateStr: string; // e.g. "2026-07-01"
  dayName: string; // e.g. "WED"
  shortDate: string; // e.g. "1-Jul"
  isWeekend: boolean; // SAT or SUN
}

interface StoreSaleRow {
  srNo: number;
  storeCode: string;
  storeName: string;
  region: string;
  prevYearSale: number;
  target: number;
  totalSale: number;
  achievePercent: number;
  sales: Record<string, number>; // dateStr -> sale value
}

// Format currency without decimals (e.g. ₹18,05,060)
const formatCurrencyNoDecimals = (val: number | string | null | undefined): string => {
  const num = Number(val || 0);
  if (isNaN(num)) return '₹0';
  return '₹' + Math.round(num).toLocaleString('en-IN');
};

const formatNumberNoDecimals = (val: number | string | null | undefined): string => {
  const num = Number(val || 0);
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-IN');
};

// Generate 31 days for July 2026
const JULY_2026_DAYS: DayConfig[] = Array.from({ length: 31 }, (_, i) => {
  const dayNum = i + 1;
  const dateStr = `2026-07-${dayNum < 10 ? '0' + dayNum : dayNum}`;
  const d = new Date(2026, 6, dayNum);
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayName = weekdays[d.getDay()];
  const isWeekend = dayName === 'SAT' || dayName === 'SUN';
  return { dateStr, dayName, shortDate: `${dayNum}-Jul`, isWeekend };
});

const DUMMY_STORES: StoreSaleRow[] = [
  {
    srNo: 1,
    storeCode: '5001',
    storeName: 'AJMER - MITTAL MALL',
    region: 'RAJSTHAN',
    prevYearSale: 1805060,
    target: 2000000,
    totalSale: 378340,
    achievePercent: 18.92,
    sales: {
      '2026-07-01': 40971,
      '2026-07-02': 37931,
      '2026-07-03': 55631,
      '2026-07-04': 70906,
      '2026-07-05': 127015,
      '2026-07-06': 45886,
    },
  },
  {
    srNo: 2,
    storeCode: '5002',
    storeName: 'AMRAVATI - TAPADIA CITY CENTRE',
    region: 'MAHARASHTRA',
    prevYearSale: 1507048,
    target: 1500000,
    totalSale: 306104,
    achievePercent: 20.41,
    sales: {
      '2026-07-01': 34470,
      '2026-07-02': 30077,
      '2026-07-03': 41921,
      '2026-07-04': 45300,
      '2026-07-05': 125396,
      '2026-07-06': 28940,
    },
  },
  {
    srNo: 3,
    storeCode: '5003',
    storeName: 'AYODHYA - MALL OF AVADH',
    region: 'UP',
    prevYearSale: 1845941,
    target: 2000000,
    totalSale: 331148,
    achievePercent: 16.56,
    sales: {
      '2026-07-01': 37715,
      '2026-07-02': 55541,
      '2026-07-03': 37534,
      '2026-07-04': 64682,
      '2026-07-05': 112540,
      '2026-07-06': 23136,
    },
  },
  {
    srNo: 4,
    storeCode: '5004',
    storeName: 'BHOPAL - DB MALL',
    region: 'MP',
    prevYearSale: 2715276,
    target: 2800000,
    totalSale: 499681,
    achievePercent: 17.85,
    sales: {
      '2026-07-01': 64781,
      '2026-07-02': 79079,
      '2026-07-03': 70426,
      '2026-07-04': 78746,
      '2026-07-05': 146531,
      '2026-07-06': 60118,
    },
  },
  {
    srNo: 5,
    storeCode: 'M001',
    storeName: 'PACIFIC MALL TAGORE GARDEN',
    region: 'DELHI-NCR',
    prevYearSale: 2540000,
    target: 3200000,
    totalSale: 845000,
    achievePercent: 26.41,
    sales: {
      '2026-07-01': 115000,
      '2026-07-02': 108000,
      '2026-07-03': 122000,
      '2026-07-04': 140000,
      '2026-07-05': 185000,
      '2026-07-06': 175000,
    },
  },
  {
    srNo: 6,
    storeCode: 'M002',
    storeName: 'DLF MALL OF INDIA NOIDA',
    region: 'DELHI-NCR',
    prevYearSale: 3100000,
    target: 3800000,
    totalSale: 1020000,
    achievePercent: 26.84,
    sales: {
      '2026-07-01': 140000,
      '2026-07-02': 135000,
      '2026-07-03': 150000,
      '2026-07-04': 165000,
      '2026-07-05': 220000,
      '2026-07-06': 210000,
    },
  },
  {
    srNo: 7,
    storeCode: 'M005',
    storeName: 'ELANTE MALL CHANDIGARH',
    region: 'PUNJAB',
    prevYearSale: 2200000,
    target: 2800000,
    totalSale: 730000,
    achievePercent: 26.07,
    sales: {
      '2026-07-01': 100000,
      '2026-07-02': 95000,
      '2026-07-03': 110000,
      '2026-07-04': 115000,
      '2026-07-05': 160000,
      '2026-07-06': 150000,
    },
  },
];

export const DayWiseStoreSaleScreen: React.FC<{ navigation?: any }> = () => {
  const { theme, isDark } = useTheme();

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>('JULY-2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [storeRows, setStoreRows] = useState<StoreSaleRow[]>(DUMMY_STORES);
  const [activeTab, setActiveTab] = useState<'MATRIX_TABLE' | 'SHOW_ALL' | 'STORE_CARDS'>('MATRIX_TABLE');

  // Filter stores by search query
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return storeRows;
    const q = searchQuery.toLowerCase().trim();
    return storeRows.filter(
      (s) =>
        s.storeName.toLowerCase().includes(q) ||
        s.storeCode.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    );
  }, [storeRows, searchQuery]);

  // Compute Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totTarget = 0;
    let totSale = 0;
    let totPrevYear = 0;
    let totWeekend = 0;

    storeRows.forEach((row) => {
      totTarget += row.target;
      totSale += row.totalSale;
      totPrevYear += row.prevYearSale;

      Object.entries(row.sales).forEach(([dStr, val]) => {
        const dayCfg = JULY_2026_DAYS.find((d) => d.dateStr === dStr);
        if (dayCfg?.isWeekend) {
          totWeekend += val;
        }
      });
    });

    const achievePct = totTarget > 0 ? (totSale / totTarget) * 100 : 0;

    return {
      totalTarget: totTarget,
      totalSale: totSale,
      prevYearSale: totPrevYear,
      weekendSale: totWeekend,
      achievePercent: achievePct,
    };
  }, [storeRows]);

  // Compute Consolidated Day-Wise Daily Matrix across all stores
  const consolidatedDailySales = useMemo(() => {
    let grandTotal = 0;
    let maxDaySale = 0;

    const daysData = JULY_2026_DAYS.map((day) => {
      let daySale = 0;
      let reportingStores = 0;

      storeRows.forEach((s) => {
        if (s.sales[day.dateStr] !== undefined) {
          daySale += s.sales[day.dateStr];
          reportingStores += 1;
        }
      });

      if (daySale > maxDaySale) maxDaySale = daySale;
      grandTotal += daySale;

      return {
        ...day,
        daySale,
        reportingStores,
        avgPerStore: reportingStores > 0 ? daySale / reportingStores : 0,
      };
    });

    return {
      grandTotal,
      maxDaySale,
      daysData,
    };
  }, [storeRows]);

  // Compute Matrix Table Totals
  const matrixTotals = useMemo(() => {
    let totPrevYear = 0;
    let totTarget = 0;
    let totSale = 0;
    const dailyTotals: Record<string, number> = {};

    JULY_2026_DAYS.forEach((d) => { dailyTotals[d.dateStr] = 0; });

    filteredStores.forEach((r) => {
      totPrevYear += r.prevYearSale;
      totTarget += r.target;
      totSale += r.totalSale;

      JULY_2026_DAYS.forEach((d) => {
        const amt = r.sales[d.dateStr];
        if (amt) {
          dailyTotals[d.dateStr] += amt;
        }
      });
    });

    const achievePct = totTarget > 0 ? (totSale / totTarget) * 100 : 0;

    return {
      prevYearSale: totPrevYear,
      target: totTarget,
      totalSale: totSale,
      achievePercent: achievePct,
      dailyTotals,
    };
  }, [filteredStores]);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Day Wise Store Sale"
        subtitle={`Target vs Achievement • ${selectedMonth}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {/* Control Bar & Search */}
      <View style={[styles.controlBar, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
        <View style={[styles.monthChip, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Calendar size={12} color={theme.primary} />
          <Text style={[styles.monthChipText, { color: theme.textPrimary }]}>JULY-2026</Text>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search store code, name, region..."
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

      {/* Three Tab Switcher */}
      <View style={[styles.tabBarContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'MATRIX_TABLE' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
          ]}
          onPress={() => setActiveTab('MATRIX_TABLE')}
          activeOpacity={0.8}
        >
          <Table size={13} color={activeTab === 'MATRIX_TABLE' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'MATRIX_TABLE' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Matrix Grid
          </Text>
        </TouchableOpacity>

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
            Daily Pulse
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'STORE_CARDS' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
          ]}
          onPress={() => setActiveTab('STORE_CARDS')}
          activeOpacity={0.8}
        >
          <Layers size={13} color={activeTab === 'STORE_CARDS' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'STORE_CARDS' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Store Cards
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator>
        {/* Executive KPI Summary Cards Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 12 }}>
          <View style={styles.kpiWrap}>
            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#fff7ed', borderColor: '#fed7aa' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#ffedd5' }]}>
                <Award size={14} color="#c55a11" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#c55a11' }]}>TOTAL TARGET</Text>
                <Text style={[styles.kValue, { color: '#9a3412' }]}>
                  {formatCurrencyNoDecimals(summaryMetrics.totalTarget)}
                </Text>
              </View>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#ecfdf5', borderColor: '#a7f3d0' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#d1fae5' }]}>
                <TrendingUp size={14} color="#059669" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#047857' }]}>TOTAL SALE</Text>
                <Text style={[styles.kValue, { color: '#065f46' }]}>
                  {formatCurrencyNoDecimals(summaryMetrics.totalSale)}
                </Text>
              </View>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#bfdbfe' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#dbeafe' }]}>
                <Store size={14} color="#1d4ed8" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#1e40af' }]}>PREV YEAR SALE</Text>
                <Text style={[styles.kValue, { color: '#1e3a8a' }]}>
                  {formatCurrencyNoDecimals(summaryMetrics.prevYearSale)}
                </Text>
              </View>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#fefce8', borderColor: '#fef08a' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#fef9c3' }]}>
                <Sparkles size={14} color="#ca8a04" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#a16207' }]}>ACHIEVE %</Text>
                <Text style={[styles.kValue, { color: '#713f12' }]}>
                  {summaryMetrics.achievePercent.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#dcfce7' }]}>
                <CalendarCheck size={14} color="#16a34a" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#15803d' }]}>WEEKEND SALE</Text>
                <Text style={[styles.kValue, { color: '#166534' }]}>
                  {formatCurrencyNoDecimals(summaryMetrics.weekendSale)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* TAB 1: EXCEL MATRIX GRID TABLE */}
        {activeTab === 'MATRIX_TABLE' ? (
          <View style={{ marginHorizontal: 12, marginTop: 4 }}>
            <Text style={[styles.listHeaderTitle, { color: theme.textSecondary, marginBottom: 8 }]}>
              FULL STORE DAY-WISE TARGET VS ACHIEVEMENT REPORT ({filteredStores.length} STORES)
            </Text>

            <View style={[styles.matrixTableBox, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
                {/* Table Container with Fixed Left Panel & Scrollable Right Panel */}
                <View style={{ flexDirection: 'row' }}>
                  {/* ── FIXED LEFT PANEL (SR. NO & STORES ONLY FOR MOBILE SPACE) ── */}
                  <View style={[styles.fixedLeftColumn, { borderRightColor: theme.border, backgroundColor: theme.cardBg }]}>
                    {/* Group Header Cell */}
                    <View style={[styles.groupHeaderCellFixed, { backgroundColor: isDark ? '#1e293b' : '#dbeafe' }]}>
                      <Text style={[styles.groupHeaderText, { color: isDark ? '#93c5fd' : '#1e40af' }]} numberOfLines={1}>
                        STORE DETAILS
                      </Text>
                    </View>

                    {/* Cols Header Row */}
                    <View style={[styles.tableColsHeaderRowFixed, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Text style={[styles.colTh, { width: 34, color: theme.textSecondary, textAlign: 'center' }]}>#</Text>
                      <Text style={[styles.colTh, { width: 140, color: theme.textSecondary }]}>STORES</Text>
                    </View>

                    {/* Fixed Rows */}
                    {filteredStores.map((row, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <View
                          key={`fixed-${row.storeCode}`}
                          style={[
                            styles.fixedRowCell,
                            {
                              backgroundColor: isEven
                                ? isDark ? '#1e293b22' : '#ffffff'
                                : isDark ? '#0f172a33' : '#f8fafc',
                              borderBottomColor: theme.border,
                            },
                          ]}
                        >
                          <Text style={[styles.colTd, { width: 34, textAlign: 'center', color: theme.textMuted }]}>{idx + 1}</Text>
                          <Text style={[styles.colTd, { width: 140, fontWeight: '900', color: theme.textPrimary }]} numberOfLines={1}>
                            {row.storeName}
                          </Text>
                        </View>
                      );
                    })}

                    {/* Fixed Footer Total Cell */}
                    <View style={[styles.fixedRowCell, styles.tableFooterRow, { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderTopWidth: 2, borderTopColor: theme.primary }]}>
                      <Text style={[styles.colTdFooter, { width: 34, textAlign: 'center', color: theme.primary }]}>∑</Text>
                      <Text style={[styles.colTdFooter, { width: 140, color: theme.primary }]} numberOfLines={1}>TOTAL ({filteredStores.length})</Text>
                    </View>
                  </View>

                  {/* ── SCROLLABLE RIGHT PANEL (REGION + TARGET VS ACH + DAY COLUMNS) ── */}
                  <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingRight: 24 }}>
                    <View>
                      {/* Group Header Row */}
                      <View style={styles.groupHeaderRowRight}>
                        <View style={[styles.groupHeaderCell, { width: 535, backgroundColor: isDark ? '#1e3a5f' : '#bfdbfe' }]}>
                          <Text style={[styles.groupHeaderText, { color: isDark ? '#bfdbfe' : '#1d4ed8' }]}>
                            TARGET VS ACHIEVEMENT (JULY-2026)
                          </Text>
                        </View>
                        <View style={[styles.groupHeaderCell, { width: JULY_2026_DAYS.length * 85, backgroundColor: isDark ? '#311b92' : '#c7d2fe' }]}>
                          <Text style={[styles.groupHeaderText, { color: isDark ? '#e0e7ff' : '#3730a3' }]}>
                            DAILY STORE SALES MATRIX
                          </Text>
                        </View>
                      </View>

                      {/* Sub-Header Columns Row */}
                      <View style={[styles.tableColsHeaderRowRight, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                        <Text style={[styles.colTh, { width: 85, color: theme.textSecondary }]}>REGION</Text>
                        <Text style={[styles.colTh, { width: 115, color: theme.textSecondary, textAlign: 'right' }]}>JULY-2025 TOTAL SALE</Text>
                        <Text style={[styles.colTh, { width: 110, color: theme.textSecondary, textAlign: 'right' }]}>JULY-2026 TARGET</Text>
                        <Text style={[styles.colTh, { width: 115, color: theme.textSecondary, textAlign: 'right' }]}>JULY-2026 TOTAL SALE</Text>
                        <Text style={[styles.colTh, { width: 110, color: isDark ? '#a7f3d0' : '#047857', textAlign: 'right', fontWeight: '900' }]}>ACHIEVE (%) JULY-2026</Text>

                        {/* Day Columns */}
                        {JULY_2026_DAYS.map((d) => (
                          <View key={`th-${d.dateStr}`} style={{ width: 85, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 9.5, fontWeight: '700', color: d.isWeekend ? '#c55a11' : theme.textMuted }}>{d.dayName}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textPrimary }}>{d.shortDate}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Data Rows */}
                      {filteredStores.map((row, idx) => {
                        const isEven = idx % 2 === 0;
                        const achColor = row.achievePercent >= 20 ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#fca5a5' : '#b91c1c');
                        const achBg = row.achievePercent >= 20 ? (isDark ? '#065f4633' : '#dcfce7') : (isDark ? '#7f1d1d33' : '#fee2e2');

                        return (
                          <View
                            key={`right-${row.storeCode}`}
                            style={[
                              styles.rightRowCell,
                              {
                                backgroundColor: isEven
                                  ? isDark ? '#1e293b22' : '#ffffff'
                                  : isDark ? '#0f172a33' : '#f8fafc',
                                borderBottomColor: theme.border,
                              },
                            ]}
                          >
                            <Text style={[styles.colTd, { width: 85, color: theme.textSecondary, fontWeight: '700' }]} numberOfLines={1}>
                              {row.region}
                            </Text>
                            <Text style={[styles.colTd, { width: 115, textAlign: 'right', fontWeight: '700', color: theme.textSecondary }]}>
                              {formatCurrencyNoDecimals(row.prevYearSale)}
                            </Text>
                            <Text style={[styles.colTd, { width: 110, textAlign: 'right', fontWeight: '800', color: theme.textPrimary }]}>
                              {formatCurrencyNoDecimals(row.target)}
                            </Text>
                            <Text style={[styles.colTd, { width: 115, textAlign: 'right', fontWeight: '900', color: theme.primary }]}>
                              {formatCurrencyNoDecimals(row.totalSale)}
                            </Text>
                            <View style={{ width: 110, alignItems: 'flex-end', paddingRight: 4 }}>
                              <View style={{ backgroundColor: achBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10.5, fontWeight: '900', color: achColor }}>
                                  {row.achievePercent.toFixed(2)}%
                                </Text>
                              </View>
                            </View>

                            {JULY_2026_DAYS.map((d) => {
                              const amt = row.sales[d.dateStr];
                              return (
                                <Text
                                  key={`cell-${row.storeCode}-${d.dateStr}`}
                                  style={[
                                    styles.colTd,
                                    {
                                      width: 85,
                                      textAlign: 'right',
                                      fontWeight: amt && amt > 0 ? '700' : '400',
                                      color: amt && amt > 0 ? (d.isWeekend ? '#c55a11' : theme.textPrimary) : theme.textMuted,
                                    },
                                  ]}
                                >
                                  {amt && amt > 0 ? formatCurrencyNoDecimals(amt) : '-'}
                                </Text>
                              );
                            })}
                          </View>
                        );
                      })}

                      {/* Footer Total Row */}
                      <View style={[styles.rightRowCell, styles.tableFooterRow, { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderTopWidth: 2, borderTopColor: theme.primary }]}>
                        <Text style={[styles.colTdFooter, { width: 85, color: theme.primary }]}>ALL</Text>
                        <Text style={[styles.colTdFooter, { width: 115, textAlign: 'right', color: theme.primary }]}>
                          {formatCurrencyNoDecimals(matrixTotals.prevYearSale)}
                        </Text>
                        <Text style={[styles.colTdFooter, { width: 110, textAlign: 'right', color: theme.primary }]}>
                          {formatCurrencyNoDecimals(matrixTotals.target)}
                        </Text>
                        <Text style={[styles.colTdFooter, { width: 115, textAlign: 'right', color: theme.primary }]}>
                          {formatCurrencyNoDecimals(matrixTotals.totalSale)}
                        </Text>
                        <View style={{ width: 110, alignItems: 'flex-end', paddingRight: 4 }}>
                          <View style={{ backgroundColor: matrixTotals.achievePercent >= 20 ? '#10b98122' : '#ef444422', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 11, fontWeight: '900', color: matrixTotals.achievePercent >= 20 ? '#10b981' : '#ef4444' }}>
                              {matrixTotals.achievePercent.toFixed(2)}%
                            </Text>
                          </View>
                        </View>

                        {JULY_2026_DAYS.map((d) => {
                          const dayTot = matrixTotals.dailyTotals[d.dateStr] || 0;
                          return (
                            <Text key={`ft-${d.dateStr}`} style={[styles.colTdFooter, { width: 85, textAlign: 'right', color: theme.primary }]}>
                              {formatCurrencyNoDecimals(dayTot)}
                            </Text>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
          </View>
        ) : activeTab === 'SHOW_ALL' ? (
          /* TAB 2: SHOW ALL (Consolidated Daily Sales Matrix) */
          <View style={styles.cardsList}>
            <Text style={[styles.listHeaderTitle, { color: theme.textSecondary }]}>
              CONSOLIDATED DAY-WISE SALES MATRIX ({consolidatedDailySales.daysData.filter((d) => d.daySale > 0).length} DAYS GONE)
            </Text>

            <View style={[styles.dailyTableBox, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
              <View style={[styles.dailyTableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.dailyThText, { color: theme.textSecondary, width: 85 }]}>DATE</Text>
                <Text style={[styles.dailyThText, { color: theme.textSecondary, width: 45 }]}>DAY</Text>
                <Text style={[styles.dailyThText, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>TOTAL NET SALE</Text>
              </View>

              {consolidatedDailySales.daysData.map((day) => {
                const dayNum = parseInt(day.dateStr.split('-')[2], 10);
                const hasSale = day.daySale > 0;
                const pctOfMax = consolidatedDailySales.maxDaySale > 0 ? (day.daySale / consolidatedDailySales.maxDaySale) * 100 : 0;

                return (
                  <View
                    key={day.dateStr}
                    style={[
                      styles.dailyTableRow,
                      {
                        backgroundColor: day.isWeekend
                          ? isDark ? '#33271e33' : '#FFF7ED'
                          : isDark ? '#1e293b11' : '#ffffff',
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <View style={{ width: 85 }}>
                      <Text style={[styles.dailyTdDate, { color: theme.textPrimary }]}>
                        {dayNum} Jul 2026
                      </Text>
                      {hasSale ? (
                        <Text style={{ fontSize: 8.5, color: theme.textMuted }}>
                          {day.reportingStores} Stores
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.dayBadge,
                        { backgroundColor: day.isWeekend ? '#FFEDD5' : '#DBEAFE', width: 45, alignItems: 'center' },
                      ]}
                    >
                      <Text style={[styles.dayBadgeText, { color: day.isWeekend ? '#C55A11' : '#1D4ED8' }]}>
                        {day.dayName}
                      </Text>
                    </View>

                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={[styles.dailyTdVal, { color: hasSale ? (day.isWeekend ? '#C55A11' : theme.primary) : theme.textMuted }]}>
                        {hasSale ? formatCurrencyNoDecimals(day.daySale) : '₹0'}
                      </Text>
                      {hasSale ? (
                        <View style={{ width: '80%', height: 3, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 1.5, marginTop: 3 }}>
                          <View
                            style={{
                              width: `${Math.min(100, pctOfMax)}%`,
                              height: '100%',
                              backgroundColor: day.isWeekend ? '#f97316' : '#2563eb',
                              borderRadius: 1.5,
                            }}
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              {/* Total Consolidated Footer Row */}
              <View style={[styles.dailyTableRow, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderBottomWidth: 0, paddingVertical: 10 }]}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: theme.primary, width: 130 }}>
                  TOTAL MTD SALE
                </Text>
                <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '900', color: theme.primary, textAlign: 'right' }}>
                  {formatCurrencyNoDecimals(consolidatedDailySales.grandTotal)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* TAB 3: STORE CARDS SCORECARD VIEW */
          <View style={styles.cardsList}>
            <Text style={[styles.listHeaderTitle, { color: theme.textSecondary }]}>
              STORE DAILY SALES SCORECARDS ({filteredStores.length})
            </Text>

            {filteredStores.map((row, idx) => {
              const achPct = row.achievePercent;
              const barPct = Math.min(100, achPct);

              let storeWeekendSale = 0;
              Object.entries(row.sales).forEach(([dStr, val]) => {
                const dCfg = JULY_2026_DAYS.find((d) => d.dateStr === dStr);
                if (dCfg?.isWeekend) storeWeekendSale += val;
              });

              return (
                <View
                  key={row.storeCode}
                  style={[styles.storeCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.rankIconBox, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
                        <Text style={[styles.rankText, { color: theme.primary }]}>#{idx + 1}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.storeNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                          {row.storeName}
                        </Text>
                        <Text style={[styles.storeMetaText, { color: theme.textMuted }]}>
                          {row.storeCode} • {row.region}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.achPill, { backgroundColor: isDark ? '#1e293b' : '#FEF3C7' }]}>
                      <Text style={[styles.achPillText, { color: '#92400E' }]}>
                        {achPct.toFixed(2)}% Achieved
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 10, marginBottom: 10 }}>
                    <View style={[styles.barTrack, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${barPct}%`,
                            backgroundColor: '#10b981',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={[styles.metricsGrid, { backgroundColor: isDark ? '#1e293b33' : '#f8fafc', borderColor: theme.border }]}>
                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>JULY-2026 TARGET</Text>
                      <Text style={[styles.mVal, { color: theme.textPrimary }]}>{formatCurrencyNoDecimals(row.target)}</Text>
                    </View>
                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>JULY-2026 TOTAL SALE</Text>
                      <Text style={[styles.mVal, { color: theme.primary }]}>{formatCurrencyNoDecimals(row.totalSale)}</Text>
                    </View>
                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>JULY-2025 TOTAL SALE</Text>
                      <Text style={[styles.mVal, { color: theme.textSecondary }]}>{formatCurrencyNoDecimals(row.prevYearSale)}</Text>
                    </View>
                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>WEEKEND SALE</Text>
                      <Text style={[styles.mVal, { color: '#c55a11' }]}>{formatCurrencyNoDecimals(storeWeekendSale)}</Text>
                    </View>
                  </View>

                  {/* Daily Date Breakdown Table inside Store Card */}
                  <View style={[styles.dailyTableBox, { borderColor: theme.border, marginTop: 8 }]}>
                    <View style={[styles.dailyTableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Text style={[styles.dailyThText, { color: theme.textSecondary }]}>DATE</Text>
                      <Text style={[styles.dailyThText, { color: theme.textSecondary }]}>DAY</Text>
                      <Text style={[styles.dailyThText, { color: theme.textSecondary, textAlign: 'right' }]}>NET SALE</Text>
                    </View>

                    {JULY_2026_DAYS.filter((d) => row.sales[d.dateStr] !== undefined).map((day) => {
                      const saleVal = row.sales[day.dateStr];

                      return (
                        <View
                          key={day.dateStr}
                          style={[
                            styles.dailyTableRow,
                            {
                              backgroundColor: day.isWeekend
                                ? isDark ? '#33271e33' : '#FFF7ED'
                                : isDark ? '#1e293b11' : '#ffffff',
                              borderBottomColor: theme.border,
                            },
                          ]}
                        >
                          <Text style={[styles.dailyTdDate, { color: theme.textPrimary }]}>
                            {day.shortDate} 2026
                          </Text>
                          <View
                            style={[
                              styles.dayBadge,
                              { backgroundColor: day.isWeekend ? '#FFEDD5' : '#DBEAFE' },
                            ]}
                          >
                            <Text style={[styles.dayBadgeText, { color: day.isWeekend ? '#C55A11' : '#1D4ED8' }]}>
                              {day.dayName}
                            </Text>
                          </View>
                          <Text style={[styles.dailyTdVal, { color: day.isWeekend ? '#c55a11' : theme.textPrimary }]}>
                            {formatCurrencyNoDecimals(saleVal)}
                          </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
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
  monthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  monthChipText: { fontSize: 11.5, fontWeight: '900' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, fontSize: 11.5, fontWeight: '600', paddingVertical: 0 },

  // KPI Cards
  kpiWrap: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 135,
  },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kLabel: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  kValue: { fontSize: 13.5, fontWeight: '900', marginTop: 1 },

  // Cards List
  cardsList: { paddingHorizontal: 12, gap: 12 },
  listHeaderTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },

  // Matrix Table Styles
  matrixTableBox: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fixedLeftColumn: {
    borderRightWidth: 1,
    zIndex: 10,
  },
  groupHeaderCellFixed: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  groupHeaderRowRight: {
    flexDirection: 'row',
    height: 32,
  },
  groupHeaderCell: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  groupHeaderText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tableColsHeaderRowFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 4,
  },
  tableColsHeaderRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  colTh: {
    fontSize: 9.5,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  fixedRowCell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  rightRowCell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderBottomWidth: 1,
  },
  colTd: {
    fontSize: 11,
    paddingHorizontal: 4,
  },
  colTdFooter: {
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  tableFooterRow: {
    height: 40,
  },

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
  storeNameText: { fontSize: 13.5, fontWeight: '900' },
  storeMetaText: { fontSize: 10.5, fontWeight: '700', marginTop: 1 },
  achPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  achPillText: { fontSize: 11, fontWeight: '900' },

  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  mCell: { width: '50%', padding: 4 },
  mLbl: { fontSize: 10, fontWeight: '800' },
  mVal: { fontSize: 11.5, fontWeight: '900', marginTop: 1 },

  // Daily Table Box
  dailyTableBox: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  dailyTableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, justifyContent: 'space-between' },
  dailyThText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  dailyTableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  dailyTdDate: { fontSize: 11, fontWeight: '800' },
  dayBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dayBadgeText: { fontSize: 9.5, fontWeight: '900' },
  dailyTdVal: { fontSize: 11.5, fontWeight: '900' },
});
