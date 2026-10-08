import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { Badge } from '../Badge';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

export interface StoreBreakdownItem {
  storeCode: string;
  storeName: string;
  netSales: number;
  ordersCount: number;
}

interface SalesReportStoreAuditTabProps {
  storeBreakdown: StoreBreakdownItem[];
  fromDate: string;
  toDate: string;
}

export const SalesReportStoreAuditTab: React.FC<SalesReportStoreAuditTabProps> = ({
  storeBreakdown,
  fromDate,
  toDate,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.mainCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Chain Outlet Audit Summary</Text>

      {storeBreakdown.length === 0 ? (
        <View style={styles.emptyBox}>
          <Building2 size={40} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Store Audit Records</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>No store sales returned for period ({fromDate} to {toDate}).</Text>
        </View>
      ) : (
        storeBreakdown.map((row) => (
          <View key={row.storeCode} style={[styles.storeCardItem, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
            <View style={styles.storeCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.storeTitleText, { color: theme.textPrimary }]}>{row.storeName}</Text>
                <Text style={[styles.storeSubText, { color: theme.textSecondary }]}>
                  Store Code: {row.storeCode} • {row.ordersCount} Orders
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.storeNetText, { color: isDark ? '#6ee7b7' : '#16a34a' }]}>{formatCurrency(row.netSales)}</Text>
                <Badge label="Active Store" variant="info" />
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  storeCardItem: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  storeSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  storeNetText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
    marginBottom: 4,
  },
});
