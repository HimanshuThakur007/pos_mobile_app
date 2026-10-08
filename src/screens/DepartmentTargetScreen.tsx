import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { TopAppBar } from '../components/TopAppBar';
import { drawerEvents } from '../utils/drawerEvents';
import { useTheme } from '../context/ThemeContext';
import {
  Target,
  Edit3,
  Calendar,
  X,
  Check,
  AlertCircle,
  Search,
  Building2,
  Sparkles,
  TrendingUp,
  Award,
  Table,
  Layers,
  Store,
} from 'lucide-react-native';

interface DeptRow {
  department: string;
  contributionPercent: number;
  target: number;
  requiredPerDayAvg: number;
  ttlQty: number;
  ttlValue: number;
  tgtAchPercent: number;
  mtdAvg: number;
  bal: number;
  deptProjection: number;
  deptAchPercent: number;
}

// Standard Indian Currency Formatter without decimals (e.g. ₹30,96,00,000)
const formatCurrencyNoDecimals = (val: number | string | null | undefined): string => {
  const num = Number(val || 0);
  if (isNaN(num)) return '₹0';
  return '₹' + Math.round(num).toLocaleString('en-IN');
};

const formatNumber = (val: number | string | null | undefined): string => {
  const num = Number(val || 0);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
};

const INITIAL_ROWS: DeptRow[] = [
  {
    department: 'BABY & KIDS',
    contributionPercent: 1.00,
    target: 3096000,
    requiredPerDayAvg: 99871,
    ttlQty: 4203,
    ttlValue: 641959,
    tgtAchPercent: 0.2074,
    mtdAvg: 106993,
    bal: -2454041,
    deptProjection: 3316788,
    deptAchPercent: 1.0713,
  },
  {
    department: 'BATHROOM',
    contributionPercent: 3.43,
    target: 10619280,
    requiredPerDayAvg: 342557,
    ttlQty: 10085,
    ttlValue: 2217138,
    tgtAchPercent: 0.2088,
    mtdAvg: 369523,
    bal: -8402142,
    deptProjection: 11455211,
    deptAchPercent: 1.0787,
  },
  {
    department: 'BEAUTY & COSMETICS',
    contributionPercent: 2.50,
    target: 7740000,
    requiredPerDayAvg: 249677,
    ttlQty: 8400,
    ttlValue: 1650000,
    tgtAchPercent: 0.2132,
    mtdAvg: 275000,
    bal: -6090000,
    deptProjection: 8525000,
    deptAchPercent: 1.1014,
  },
  {
    department: 'CROCKERY & DINING',
    contributionPercent: 8.00,
    target: 24768000,
    requiredPerDayAvg: 798968,
    ttlQty: 22100,
    ttlValue: 5320000,
    tgtAchPercent: 0.2148,
    mtdAvg: 886667,
    bal: -19448000,
    deptProjection: 27486667,
    deptAchPercent: 1.1098,
  },
  {
    department: 'DECOR & LIGHTING',
    contributionPercent: 12.00,
    target: 37152000,
    requiredPerDayAvg: 1198452,
    ttlQty: 34500,
    ttlValue: 7950000,
    tgtAchPercent: 0.2140,
    mtdAvg: 1325000,
    bal: -29202000,
    deptProjection: 41075000,
    deptAchPercent: 1.1056,
  },
  {
    department: 'FOOTWEAR',
    contributionPercent: 15.00,
    target: 46440000,
    requiredPerDayAvg: 1498065,
    ttlQty: 45200,
    ttlValue: 9840000,
    tgtAchPercent: 0.2119,
    mtdAvg: 1640000,
    bal: -36600000,
    deptProjection: 50840000,
    deptAchPercent: 1.0947,
  },
  {
    department: 'HARDWARE & TOOLS',
    contributionPercent: 4.00,
    target: 12384000,
    requiredPerDayAvg: 399484,
    ttlQty: 12300,
    ttlValue: 2680000,
    tgtAchPercent: 0.2164,
    mtdAvg: 446667,
    bal: -9704000,
    deptProjection: 13846667,
    deptAchPercent: 1.1181,
  },
  {
    department: 'HOUSEHOLD ORGANIZERS',
    contributionPercent: 14.00,
    target: 43344000,
    requiredPerDayAvg: 1398194,
    ttlQty: 38900,
    ttlValue: 9210000,
    tgtAchPercent: 0.2125,
    mtdAvg: 1535000,
    bal: -34134000,
    deptProjection: 47585000,
    deptAchPercent: 1.0978,
  },
  {
    department: 'KITCHENWARE',
    contributionPercent: 16.00,
    target: 49536000,
    requiredPerDayAvg: 1597935,
    ttlQty: 48600,
    ttlValue: 10820000,
    tgtAchPercent: 0.2184,
    mtdAvg: 1803333,
    bal: -38716000,
    deptProjection: 55903333,
    deptAchPercent: 1.1285,
  },
  {
    department: 'STATIONERY & OFFICE',
    contributionPercent: 6.00,
    target: 18576000,
    requiredPerDayAvg: 599226,
    ttlQty: 19800,
    ttlValue: 4050000,
    tgtAchPercent: 0.2180,
    mtdAvg: 675000,
    bal: -14526000,
    deptProjection: 20925000,
    deptAchPercent: 1.1265,
  },
  {
    department: 'TOYS & GAMES',
    contributionPercent: 3.07,
    target: 9504720,
    requiredPerDayAvg: 306604,
    ttlQty: 11400,
    ttlValue: 2345000,
    tgtAchPercent: 0.2467,
    mtdAvg: 390833,
    bal: -7159720,
    deptProjection: 12115833,
    deptAchPercent: 1.2747,
  },
];

export const DepartmentTargetScreen: React.FC<{ navigation?: any }> = () => {
  const { theme, isDark } = useTheme();

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>('JULY-2026');
  const [reportDate, setReportDate] = useState<string>('06/07/2026');
  const [totalTarget, setTotalTarget] = useState<number>(309600000);
  const [totalDays, setTotalDays] = useState<number>(31);
  const [noOfDaysGone, setNoOfDaysGone] = useState<number>(6);
  const [rows, setRows] = useState<DeptRow[]>(INITIAL_ROWS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);

  // Form State inside Config Modal
  const [formDate, setFormDate] = useState<string>('');
  const [formTotalTarget, setFormTotalTarget] = useState<string>('');
  const [formTotalDays, setFormTotalDays] = useState<string>('');
  const [formNoOfDaysGone, setFormNoOfDaysGone] = useState<string>('');
  const [formContribs, setFormContribs] = useState<{ [dept: string]: string }>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Open Config Modal
  const openConfigModal = () => {
    setFormDate(reportDate);
    setFormTotalTarget(String(totalTarget));
    setFormTotalDays(String(totalDays));
    setFormNoOfDaysGone(String(noOfDaysGone));
    const cMap: { [dept: string]: string } = {};
    rows.forEach((r) => {
      cMap[r.department] = String(r.contributionPercent);
    });
    setFormContribs(cMap);
    setSaveError(null);
    setIsEditingConfig(true);
  };

  // Handle Save Configuration
  const handleSaveConfig = () => {
    setSaveError(null);
    const parsedTarget = parseFloat(formTotalTarget) || 0;
    const parsedDays = parseInt(formTotalDays, 10) || 31;
    const parsedDaysGone = parseInt(formNoOfDaysGone, 10) || 6;

    const sum = Object.values(formContribs).reduce(
      (acc, val) => acc + (parseFloat(val) || 0),
      0
    );

    if (Math.abs(sum - 100) > 0.1) {
      setSaveError(
        `Contribution percentages must sum to 100% (Current sum: ${sum.toFixed(2)}%)`
      );
      return;
    }

    setReportDate(formDate);
    setTotalTarget(parsedTarget);
    setTotalDays(parsedDays);
    setNoOfDaysGone(parsedDaysGone);

    const updatedRows = rows.map((row) => {
      const contrib = parseFloat(formContribs[row.department]) || row.contributionPercent;
      const deptTgt = (parsedTarget * contrib) / 100;
      const reqDaily = parsedDays > 0 ? deptTgt / parsedDays : 0;
      const mtdAvg = parsedDaysGone > 0 ? row.ttlValue / parsedDaysGone : 0;
      const bal = row.ttlValue - deptTgt;
      const deptProj = mtdAvg * parsedDays;
      const tgtAchPct = deptTgt > 0 ? row.ttlValue / deptTgt : 0;
      const deptAchPct = deptTgt > 0 ? deptProj / deptTgt : 0;

      return {
        ...row,
        contributionPercent: contrib,
        target: deptTgt,
        requiredPerDayAvg: reqDaily,
        mtdAvg,
        bal,
        deptProjection: deptProj,
        tgtAchPercent: tgtAchPct,
        deptAchPercent: deptAchPct,
      };
    });

    setRows(updatedRows);
    setIsEditingConfig(false);
    Alert.alert('Success', 'Target configuration saved successfully!');
  };

  // Filter rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((r) => r.department.toLowerCase().includes(q));
  }, [rows, searchQuery]);

  // Compute Totals
  const totals = useMemo(() => {
    let totCont = 0;
    let totTarget = 0;
    let totReqDaily = 0;
    let totQty = 0;
    let totValue = 0;
    let totMtdAvg = 0;
    let totDeptProj = 0;

    rows.forEach((r) => {
      totCont += r.contributionPercent;
      totTarget += r.target;
      totReqDaily += r.requiredPerDayAvg;
      totQty += r.ttlQty;
      totValue += r.ttlValue;
      totMtdAvg += r.mtdAvg;
      totDeptProj += r.deptProjection;
    });

    const totBal = totValue - totTarget;
    const totTgtAchPercent = totTarget > 0 ? totValue / totTarget : 0;
    const totDeptAchPercent = totTarget > 0 ? totDeptProj / totTarget : 0;

    return {
      contributionPercent: totCont,
      target: totTarget,
      requiredPerDayAvg: totReqDaily,
      ttlQty: totQty,
      ttlValue: totValue,
      tgtAchPercent: totTgtAchPercent,
      mtdAvg: totMtdAvg,
      bal: totBal,
      deptProjection: totDeptProj,
      deptAchPercent: totDeptAchPercent,
    };
  }, [rows]);

  const overallAchPct = totals.target > 0 ? (totals.ttlValue / totals.target) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg }]}>
      <TopAppBar
        title="Department Target"
        subtitle={`Target vs Achievement • ${selectedMonth}`}
        onOpenDrawer={() => drawerEvents.openDrawer()}
      />

      {/* Control Bar */}
      <View style={[styles.topControlBar, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <View style={[styles.monthPill, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Calendar size={12} color={theme.primary} />
            <Text style={[styles.monthPillText, { color: theme.textPrimary }]}>DATE: {reportDate}</Text>
          </View>

          <TouchableOpacity
            style={[styles.configBtn, { backgroundColor: theme.primary }]}
            onPress={openConfigModal}
            activeOpacity={0.8}
          >
            <Edit3 size={12} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.configBtnText}>Configure</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search dept..."
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

      {/* Two View Switcher: "Full Report Table" vs "Department Scorecards" */}
      <View style={[styles.tabBarContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeView === 'TABLE' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
          ]}
          onPress={() => setActiveView('TABLE')}
          activeOpacity={0.8}
        >
          <Table size={13} color={activeView === 'TABLE' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeView === 'TABLE' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Full Matrix Table
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeView === 'CARDS' && [styles.activeTabItem, { backgroundColor: theme.cardBg, borderColor: theme.border }],
          ]}
          onPress={() => setActiveView('CARDS')}
          activeOpacity={0.8}
        >
          <Layers size={13} color={activeView === 'CARDS' ? theme.primary : theme.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeView === 'CARDS' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            Department Scorecards
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator>
        {/* Executive Summary Cards Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 12 }}>
          <View style={styles.kpiWrap}>
            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#fff7ed', borderColor: '#fed7aa' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#ffedd5' }]}>
                <Award size={14} color="#c55a11" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#c55a11' }]}>TOTAL TARGET</Text>
                <Text style={[styles.kValue, { color: '#9a3412' }]} numberOfLines={1}>
                  {formatCurrencyNoDecimals(totals.target)}
                </Text>
              </View>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#ecfdf5', borderColor: '#a7f3d0' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#d1fae5' }]}>
                <TrendingUp size={14} color="#059669" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#047857' }]}>TOTAL ACHIEVED</Text>
                <Text style={[styles.kValue, { color: '#065f46' }]} numberOfLines={1}>
                  {formatCurrencyNoDecimals(totals.ttlValue)}
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
                  {overallAchPct.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#bfdbfe' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#dbeafe' }]}>
                <Target size={14} color="#1d4ed8" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#1e40af' }]}>REQ DAILY AVG</Text>
                <Text style={[styles.kValue, { color: '#1e3a8a' }]} numberOfLines={1}>
                  {formatCurrencyNoDecimals(totals.requiredPerDayAvg)}
                </Text>
              </View>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1e293b' : '#f5f3ff', borderColor: '#ddd6fe' }]}>
              <View style={[styles.iconWrap, { backgroundColor: '#ede9fe' }]}>
                <Building2 size={14} color="#7e22ce" />
              </View>
              <View>
                <Text style={[styles.kLabel, { color: '#6b21a8' }]}>DEPT PROJECTION</Text>
                <Text style={[styles.kValue, { color: '#581c87' }]} numberOfLines={1}>
                  {formatCurrencyNoDecimals(totals.deptProjection)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* VIEW 1: FULL EXCEL MATRIX TABLE WITH FIXED DEPARTMENT COLUMN */}
        {activeView === 'TABLE' ? (
          <View style={styles.tableSection}>
            <Text style={[styles.listHeaderTitle, { color: theme.textSecondary, marginLeft: 12, marginBottom: 8 }]}>
              FULL DEPARTMENT TARGET MATRIX REPORT ({filteredRows.length} DEPARTMENTS)
            </Text>

            <View style={[styles.matrixTableBox, { borderColor: theme.border, backgroundColor: theme.cardBg, marginHorizontal: 12 }]}>
              {/* Company Name Sub-header Banner */}
              <View style={[styles.tableCompanyBar, { backgroundColor: isDark ? '#0f172a' : '#1d4ed8' }]}>
                <Text style={styles.tableCompanyText}>Market Ninety Nine Pvt. Ltd.</Text>
              </View>

              {/* Table Container with Fixed Left Panel & Scrollable Right Panel */}
              <View style={{ flexDirection: 'row' }}>
                {/* ── FIXED LEFT PANEL (S.NO. & DEPARTMENT) ── */}
                <View style={[styles.fixedLeftColumn, { borderRightColor: theme.border, backgroundColor: theme.cardBg }]}>
                  {/* Group Header Cell */}
                  <View style={[styles.groupHeaderCellFixed, { backgroundColor: isDark ? '#1e293b' : '#dbeafe' }]}>
                    <Text style={[styles.groupHeaderText, { color: isDark ? '#93c5fd' : '#1e40af' }]} numberOfLines={1}>
                      DATE: {reportDate}
                    </Text>
                  </View>

                  {/* Cols Header Row */}
                  <View style={[styles.tableColsHeaderRowFixed, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Text style={[styles.colTh, { width: 35, color: theme.textSecondary, textAlign: 'center' }]}>#</Text>
                    <Text style={[styles.colTh, { width: 140, color: theme.textSecondary }]}>DEPARTMENT</Text>
                  </View>

                  {/* Fixed Rows */}
                  {filteredRows.map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <View
                        key={`fixed-${row.department}`}
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
                        <Text style={[styles.colTd, { width: 35, textAlign: 'center', color: theme.textMuted }]}>{idx + 1}</Text>
                        <Text style={[styles.colTd, { width: 140, fontWeight: '900', color: theme.textPrimary }]} numberOfLines={1}>
                          {row.department}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Fixed Footer Total Cell */}
                  <View style={[styles.fixedRowCell, styles.tableFooterRow, { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderTopWidth: 2, borderTopColor: theme.primary }]}>
                    <Text style={[styles.colTdFooter, { width: 35, textAlign: 'center', color: theme.primary }]}>∑</Text>
                    <Text style={[styles.colTdFooter, { width: 140, color: theme.primary }]} numberOfLines={1}>TOTAL</Text>
                  </View>
                </View>

                {/* ── SCROLLABLE RIGHT PANEL (METRICS) ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingRight: 24 }}>
                  <View style={{ width: 1160 }}>
                    {/* Group Header Row */}
                    <View style={styles.groupHeaderRowRight}>
                      <View style={[styles.groupHeaderCell, { width: 905, backgroundColor: isDark ? '#1e3a5f' : '#bfdbfe' }]}>
                        <Text style={[styles.groupHeaderText, { color: isDark ? '#bfdbfe' : '#1d4ed8' }]}>
                          TARGET VS ACHIEVEMENT {selectedMonth}
                        </Text>
                      </View>
                      <View style={[styles.groupHeaderCell, { width: 255, backgroundColor: isDark ? '#311b92' : '#c7d2fe' }]}>
                        <Text style={[styles.groupHeaderText, { color: isDark ? '#e0e7ff' : '#3730a3' }]}>
                          PROJECTION
                        </Text>
                      </View>
                    </View>

                    {/* Columns Header Row */}
                    <View style={[styles.tableColsHeaderRowRight, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Text style={[styles.colTh, { width: 130, color: theme.textSecondary, textAlign: 'right' }]}>TARGET CONT %</Text>
                      <Text style={[styles.colTh, { width: 120, color: theme.textSecondary, textAlign: 'right' }]}>TARGET</Text>
                      <Text style={[styles.colTh, { width: 135, color: theme.textSecondary, textAlign: 'right' }]}>REQUIERD/DAY AVG</Text>
                      <Text style={[styles.colTh, { width: 90, color: theme.textSecondary, textAlign: 'right' }]}>TTL QTY</Text>
                      <Text style={[styles.colTh, { width: 115, color: theme.textSecondary, textAlign: 'right' }]}>TTL VALUE</Text>
                      <Text style={[styles.colTh, { width: 95, color: theme.textSecondary, textAlign: 'right' }]}>TGT ACH %</Text>
                      <Text style={[styles.colTh, { width: 105, color: theme.textSecondary, textAlign: 'right' }]}>MTD AVG</Text>
                      <Text style={[styles.colTh, { width: 115, color: theme.textSecondary, textAlign: 'right' }]}>BAL</Text>
                      <Text style={[styles.colTh, { width: 130, color: theme.textSecondary, textAlign: 'right' }]}>DEPT PROJECTION</Text>
                      <Text style={[styles.colTh, { width: 125, color: isDark ? '#a7f3d0' : '#047857', textAlign: 'right', fontWeight: '900' }]}>DEPT ACH%</Text>
                    </View>

                    {/* Right Data Rows */}
                    {filteredRows.map((row, idx) => {
                      const isEven = idx % 2 === 0;
                      const balColor = row.bal >= 0 ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#fca5a5' : '#b91c1c');
                      const isGoodAch = row.deptAchPercent >= 1.0;
                      const projAchColor = isGoodAch ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#fca5a5' : '#b91c1c');
                      const projAchBg = isGoodAch ? (isDark ? '#065f4633' : '#dcfce7') : (isDark ? '#7f1d1d33' : '#fee2e2');

                      return (
                        <View
                          key={`right-${row.department}`}
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
                          <Text style={[styles.colTd, { width: 130, textAlign: 'right', fontWeight: '800', color: theme.textPrimary }]}>{row.contributionPercent.toFixed(2)}%</Text>
                          <Text style={[styles.colTd, { width: 120, textAlign: 'right', fontWeight: '800', color: theme.textPrimary }]}>{formatCurrencyNoDecimals(row.target)}</Text>
                          <Text style={[styles.colTd, { width: 135, textAlign: 'right', fontWeight: '800', color: theme.textSecondary }]}>{formatCurrencyNoDecimals(row.requiredPerDayAvg)}</Text>
                          <Text style={[styles.colTd, { width: 90, textAlign: 'right', fontWeight: '800', color: theme.textSecondary }]}>{formatNumber(row.ttlQty)}</Text>
                          <Text style={[styles.colTd, { width: 115, textAlign: 'right', fontWeight: '900', color: theme.primary }]}>{formatCurrencyNoDecimals(row.ttlValue)}</Text>
                          <Text style={[styles.colTd, { width: 95, textAlign: 'right', fontWeight: '900', color: theme.primary }]}>{(row.tgtAchPercent * 100).toFixed(2)}%</Text>
                          <Text style={[styles.colTd, { width: 105, textAlign: 'right', fontWeight: '800', color: theme.textSecondary }]}>{formatCurrencyNoDecimals(row.mtdAvg)}</Text>
                          <Text style={[styles.colTd, { width: 115, textAlign: 'right', fontWeight: '900', color: balColor }]}>{formatCurrencyNoDecimals(row.bal)}</Text>
                          <Text style={[styles.colTd, { width: 130, textAlign: 'right', fontWeight: '900', color: '#8b5cf6' }]}>{formatCurrencyNoDecimals(row.deptProjection)}</Text>
                          <View style={{ width: 125, alignItems: 'flex-end', paddingRight: 4 }}>
                            <View style={{ backgroundColor: projAchBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 10.5, fontWeight: '900', color: projAchColor }}>
                                {(row.deptAchPercent * 100).toFixed(2)}%
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}

                    {/* Right Footer Total Row */}
                    <View style={[styles.rightRowCell, styles.tableFooterRow, { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderTopWidth: 2, borderTopColor: theme.primary }]}>
                      <Text style={[styles.colTdFooter, { width: 130, textAlign: 'right', color: theme.primary }]}>{totals.contributionPercent.toFixed(2)}%</Text>
                      <Text style={[styles.colTdFooter, { width: 120, textAlign: 'right', color: theme.primary }]}>{formatCurrencyNoDecimals(totals.target)}</Text>
                      <Text style={[styles.colTdFooter, { width: 135, textAlign: 'right', color: theme.primary }]}>{formatCurrencyNoDecimals(totals.requiredPerDayAvg)}</Text>
                      <Text style={[styles.colTdFooter, { width: 90, textAlign: 'right', color: theme.primary }]}>{formatNumber(totals.ttlQty)}</Text>
                      <Text style={[styles.colTdFooter, { width: 115, textAlign: 'right', color: theme.primary }]}>{formatCurrencyNoDecimals(totals.ttlValue)}</Text>
                      <Text style={[styles.colTdFooter, { width: 95, textAlign: 'right', color: theme.primary }]}>{(totals.tgtAchPercent * 100).toFixed(2)}%</Text>
                      <Text style={[styles.colTdFooter, { width: 105, textAlign: 'right', color: theme.primary }]}>{formatCurrencyNoDecimals(totals.mtdAvg)}</Text>
                      <Text style={[styles.colTdFooter, { width: 115, textAlign: 'right', color: totals.bal >= 0 ? '#10b981' : '#ef4444' }]}>{formatCurrencyNoDecimals(totals.bal)}</Text>
                      <Text style={[styles.colTdFooter, { width: 130, textAlign: 'right', color: '#8b5cf6' }]}>{formatCurrencyNoDecimals(totals.deptProjection)}</Text>
                      <View style={{ width: 125, alignItems: 'flex-end', paddingRight: 4 }}>
                        <View style={{ backgroundColor: totals.deptAchPercent >= 1.0 ? '#10b98122' : '#ef444422', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: totals.deptAchPercent >= 1.0 ? '#10b981' : '#ef4444' }}>
                            {(totals.deptAchPercent * 100).toFixed(2)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        ) : (
          /* VIEW 2: DEPARTMENT SCORECARDS CARDS */
          <View style={styles.cardsList}>
            <Text style={[styles.listHeaderTitle, { color: theme.textSecondary }]}>
              DEPARTMENT TARGET SCORECARDS ({filteredRows.length})
            </Text>

            {filteredRows.map((row, idx) => {
              const achPct = row.tgtAchPercent * 100;
              const barPct = Math.min(100, achPct);
              const balText = row.bal >= 0 ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#fca5a5' : '#b91c1c');
              const projAchText = row.deptAchPercent >= 1.0 ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#fca5a5' : '#b91c1c');

              return (
                <View
                  key={row.department}
                  style={[styles.deptCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.rankIconBox, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
                        <Text style={[styles.rankText, { color: theme.primary }]}>#{idx + 1}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deptNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                          {row.department}
                        </Text>
                        <Text style={[styles.deptMetaText, { color: theme.textMuted }]}>
                          Target Cont: {row.contributionPercent.toFixed(2)}%
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
                            backgroundColor: achPct >= 100 ? '#10b981' : achPct >= 50 ? '#f59e0b' : '#ef4444',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={[styles.metricsGrid, { backgroundColor: isDark ? '#1e293b33' : '#f8fafc', borderColor: theme.border }]}>
                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>Current Target</Text>
                      <Text style={[styles.mVal, { color: theme.textPrimary }]} numberOfLines={1}>
                        {formatCurrencyNoDecimals(row.target)}
                      </Text>
                    </View>

                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>Achieved Value</Text>
                      <Text style={[styles.mVal, { color: theme.primary }]} numberOfLines={1}>
                        {formatCurrencyNoDecimals(row.ttlValue)}
                      </Text>
                    </View>

                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>Req Daily Avg</Text>
                      <Text style={[styles.mVal, { color: theme.textSecondary }]} numberOfLines={1}>
                        {formatCurrencyNoDecimals(row.requiredPerDayAvg)}
                      </Text>
                    </View>

                    <View style={styles.mCell}>
                      <Text style={[styles.mLbl, { color: theme.textMuted }]}>Total Quantity</Text>
                      <Text style={[styles.mVal, { color: theme.textSecondary }]} numberOfLines={1}>
                        {formatNumber(row.ttlQty)} Pcs
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.breakdownTableBox, { borderColor: theme.border }]}>
                    <View style={[styles.tableHeader, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Text style={[styles.thText, { color: theme.textSecondary }]}>PROJECTION PARAMETER</Text>
                      <Text style={[styles.thText, { color: theme.textSecondary, textAlign: 'right' }]}>VALUE / RATE</Text>
                    </View>

                    <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.tdLabel, { color: theme.textPrimary }]}>MTD Daily Avg</Text>
                      <Text style={[styles.tdVal, { color: theme.textPrimary }]}>{formatCurrencyNoDecimals(row.mtdAvg)}</Text>
                    </View>

                    <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.tdLabel, { color: theme.textPrimary }]}>Shortfall (BAL)</Text>
                      <Text style={[styles.tdVal, { color: balText }]}>{formatCurrencyNoDecimals(row.bal)}</Text>
                    </View>

                    <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.tdLabel, { color: theme.textPrimary }]}>Dept Projection</Text>
                      <Text style={[styles.tdVal, { color: '#8b5cf6', fontWeight: '900' }]}>{formatCurrencyNoDecimals(row.deptProjection)}</Text>
                    </View>

                    <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                      <Text style={[styles.tdLabel, { color: theme.textPrimary }]}>Projected Ach %</Text>
                      <Text style={[styles.tdVal, { color: projAchText, fontWeight: '900' }]}>{(row.deptAchPercent * 100).toFixed(2)}%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Target Editor Configuration Modal */}
      <Modal visible={isEditingConfig} transparent animationType="slide" onRequestClose={() => setIsEditingConfig(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Target size={18} color="#ffffff" />
                <Text style={styles.modalTitle}>Target Editor - {selectedMonth}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditingConfig(false)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Report Date</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Total Target Value (₹)</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    value={formTotalTarget}
                    onChangeText={setFormTotalTarget}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.formRow, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Total Days in Month</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    value={formTotalDays}
                    onChangeText={setFormTotalDays}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Days Gone</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    value={formNoOfDaysGone}
                    onChangeText={setFormNoOfDaysGone}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.subSectionTitle, { color: theme.textPrimary }]}>
                Department Contributions (%)
              </Text>

              {rows.map((row) => (
                <View key={row.department} style={[styles.contribRow, { borderColor: theme.border }]}>
                  <Text style={[styles.contribDeptName, { color: theme.textPrimary }]}>{row.department}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TextInput
                      style={[styles.contribInput, { color: theme.textPrimary, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                      value={formContribs[row.department] || ''}
                      onChangeText={(val) => setFormContribs((prev) => ({ ...prev, [row.department]: val }))}
                      keyboardType="numeric"
                    />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted }}>%</Text>
                  </View>
                </View>
              ))}

              {saveError ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{saveError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveConfig}
                activeOpacity={0.8}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save Configuration</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 8,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  monthPillText: { fontSize: 11.5, fontWeight: '900' },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  configBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  searchBox: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  searchInput: { flex: 1, fontSize: 11, fontWeight: '600', paddingVertical: 0 },

  // Tab Bar
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
    minWidth: 140,
  },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kLabel: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  kValue: { fontSize: 13.5, fontWeight: '900', marginTop: 1 },

  // Table Section
  tableSection: { marginTop: 4 },
  matrixTableBox: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableCompanyBar: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tableCompanyText: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Fixed Left Column (S.NO. & DEPARTMENT)
  fixedLeftColumn: {
    width: 175,
    borderRightWidth: 2,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  groupHeaderCellFixed: {
    height: 32,
    paddingHorizontal: 6,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableColsHeaderRowFixed: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
  },
  fixedRowCell: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },

  // Right Scrollable Columns (METRICS)
  groupHeaderRowRight: {
    height: 32,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  groupHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
  },
  groupHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tableColsHeaderRowRight: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
  },
  rightRowCell: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },

  colTh: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    paddingHorizontal: 4,
  },
  colTd: {
    fontSize: 10.5,
    paddingHorizontal: 4,
  },
  tableFooterRow: {
    height: 42,
  },
  colTdFooter: {
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 4,
  },

  // Cards List
  cardsList: { paddingHorizontal: 12, gap: 12 },
  listHeaderTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
  deptCard: {
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
  deptNameText: { fontSize: 13.5, fontWeight: '900' },
  deptMetaText: { fontSize: 10.5, fontWeight: '700', marginTop: 1 },
  achPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  achPillText: { fontSize: 11, fontWeight: '900' },

  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  mCell: { width: '50%', padding: 4 },
  mLbl: { fontSize: 10, fontWeight: '800' },
  mVal: { fontSize: 11.5, fontWeight: '900', marginTop: 1 },

  // Breakdown Parameters Box
  breakdownTableBox: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, justifyContent: 'space-between' },
  thText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  tdLabel: { fontSize: 11, fontWeight: '800' },
  tdVal: { fontSize: 11.5, fontWeight: '900' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalCard: { borderRadius: 12, overflow: 'hidden', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  modalTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  formRow: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 10, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
  input: { height: 36, borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, fontSize: 12, fontWeight: '700' },
  subSectionTitle: { fontSize: 12, fontWeight: '900', marginTop: 16, marginBottom: 8, letterSpacing: 0.4 },
  contribRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1 },
  contribDeptName: { fontSize: 11, fontWeight: '800' },
  contribInput: { width: 60, height: 30, borderRadius: 6, borderWidth: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', paddingVertical: 0 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 10, borderRadius: 6, marginTop: 12 },
  errorText: { color: '#ef4444', fontSize: 11, fontWeight: '700', flex: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, marginTop: 16, marginBottom: 24 },
  saveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
