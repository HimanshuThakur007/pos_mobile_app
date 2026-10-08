import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IndianRupee, CreditCard, ArrowUpRight } from 'lucide-react-native';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

interface SalesReportPaymentModesTabProps {
  summaryKPIs: {
    totalCash: number;
    totalCard: number;
    totalUpi: number;
  };
}

export const SalesReportPaymentModesTab: React.FC<SalesReportPaymentModesTabProps> = ({ summaryKPIs }) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.mainCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Payment Modes Collection Matrix</Text>

      <View style={styles.paymentBox}>
        <View style={styles.paymentRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.paymentIconBubble, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
              <IndianRupee size={20} color={isDark ? '#6ee7b7' : '#16a34a'} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.paymentTitleText, { color: theme.textPrimary }]}>Cash Tender</Text>
              <Text style={[styles.paymentSubText, { color: theme.textSecondary }]}>Physical currency collected at register</Text>
            </View>
          </View>
          <Text style={[styles.paymentAmountVal, { color: theme.textPrimary }]}>{formatCurrency(summaryKPIs.totalCash)}</Text>
        </View>

        <View style={[styles.paymentDividerLine, { backgroundColor: theme.divider }]} />

        <View style={styles.paymentRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.paymentIconBubble, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
              <CreditCard size={20} color={isDark ? '#93c5fd' : '#2563eb'} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.paymentTitleText, { color: theme.textPrimary }]}>Card Payments</Text>
              <Text style={[styles.paymentSubText, { color: theme.textSecondary }]}>Credit & Debit POS Machine swipe/dip</Text>
            </View>
          </View>
          <Text style={[styles.paymentAmountVal, { color: theme.textPrimary }]}>{formatCurrency(summaryKPIs.totalCard)}</Text>
        </View>

        <View style={[styles.paymentDividerLine, { backgroundColor: theme.divider }]} />

        <View style={styles.paymentRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.paymentIconBubble, { backgroundColor: isDark ? '#78350f' : '#fef3c7' }]}>
              <ArrowUpRight size={20} color={isDark ? '#fde047' : '#d97706'} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.paymentTitleText, { color: theme.textPrimary }]}>UPI & Digital QR</Text>
              <Text style={[styles.paymentSubText, { color: theme.textSecondary }]}>Dynamic QR code instant settlement</Text>
            </View>
          </View>
          <Text style={[styles.paymentAmountVal, { color: theme.textPrimary }]}>{formatCurrency(summaryKPIs.totalUpi)}</Text>
        </View>
      </View>
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
  paymentBox: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paymentIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  paymentSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  paymentAmountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  paymentDividerLine: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
});
