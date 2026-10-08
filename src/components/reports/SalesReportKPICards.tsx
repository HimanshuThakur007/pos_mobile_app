import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IndianRupee, Receipt, ShoppingBag, Tag } from 'lucide-react-native';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

interface SalesReportKPICardsProps {
  summaryKPIs: {
    totalNetSales: number;
    totalDiscount: number;
    totalOrders: number;
    totalQty: number;
    aov: number;
    totalTax: number;
  };
  isWideScreen: boolean;
  portraitCardWidth: number;
}

export const SalesReportKPICards: React.FC<SalesReportKPICardsProps> = ({
  summaryKPIs,
  isWideScreen,
  portraitCardWidth,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.kpiGrid, isWideScreen && styles.kpiGridTablet]}>
      <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }, isWideScreen ? styles.kpiCardTablet : { width: portraitCardWidth }]}>
        <View style={styles.kpiCardTop}>
          <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
            <IndianRupee size={15} color={isDark ? '#93c5fd' : '#2563eb'} />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1}>Gross Sales</Text>
        </View>
        <Text style={[styles.kpiValText, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(summaryKPIs.totalNetSales)}</Text>
        <Text style={[styles.kpiSubText, { color: theme.textMuted }]} numberOfLines={1}>Disc: -{formatCurrency(summaryKPIs.totalDiscount)}</Text>
      </View>

      <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }, isWideScreen ? styles.kpiCardTablet : { width: portraitCardWidth }]}>
        <View style={styles.kpiCardTop}>
          <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
            <Receipt size={15} color={isDark ? '#6ee7b7' : '#16a34a'} />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1}>Total Receipts</Text>
        </View>
        <Text style={[styles.kpiValText, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{summaryKPIs.totalOrders} Invoices</Text>
        <Text style={[styles.kpiSubText, { color: theme.textMuted }]} numberOfLines={1}>{summaryKPIs.totalQty} Units Sold</Text>
      </View>

      <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }, isWideScreen ? styles.kpiCardTablet : { width: portraitCardWidth }]}>
        <View style={styles.kpiCardTop}>
          <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#581c87' : '#faf5ff' }]}>
            <ShoppingBag size={15} color={isDark ? '#e9d5ff' : '#a855f7'} />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1}>Avg Order (AOV)</Text>
        </View>
        <Text style={[styles.kpiValText, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(summaryKPIs.aov)}</Text>
        <Text style={[styles.kpiSubText, { color: theme.textMuted }]} numberOfLines={1}>Basket Avg Value</Text>
      </View>

      <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }, isWideScreen ? styles.kpiCardTablet : { width: portraitCardWidth }]}>
        <View style={styles.kpiCardTop}>
          <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#78350f' : '#fef3c7' }]}>
            <Tag size={15} color={isDark ? '#fde047' : '#d97706'} />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1}>GST Tax Collected</Text>
        </View>
        <Text style={[styles.kpiValText, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(summaryKPIs.totalTax)}</Text>
        <Text style={[styles.kpiSubText, { color: theme.textMuted }]} numberOfLines={1}>CGST + SGST + IGST</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiGridTablet: {
    flexWrap: 'nowrap',
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiCardTablet: {
    flex: 1,
  },
  kpiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  kpiIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    flex: 1,
    marginRight: 4,
  },
  kpiValText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  kpiSubText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
