import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Search, Sparkles, FileText, User, ChevronRight, X } from 'lucide-react-native';
import { Badge } from '../Badge';
import { useTheme } from '../../context/ThemeContext';
import { SaleReportSummaryRow } from '../../types/salesReport';
import { formatCurrency, formatDateTimeDisplay } from '../../utils/formatters';

interface SalesReportInvoicesTabProps {
  searchQuery: string;
  onChangeSearchQuery: (text: string) => void;
  isLoading: boolean;
  filteredSummary: SaleReportSummaryRow[];
  fromDate: string;
  toDate: string;
  onRefetchData: () => void;
  onOpenInvoiceModal: (row: SaleReportSummaryRow) => void;
}

export const SalesReportInvoicesTab: React.FC<SalesReportInvoicesTabProps> = ({
  searchQuery,
  onChangeSearchQuery,
  isLoading,
  filteredSummary,
  fromDate,
  toDate,
  onRefetchData,
  onOpenInvoiceModal,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
        <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search by invoice no, cashier, terminal, customer..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => onChangeSearchQuery('')}>
            <X size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Invoices List Card */}
      <View style={[styles.mainCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.divider }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Live Sales Summary Report</Text>
          </View>
          {isLoading && <ActivityIndicator size="small" color={theme.primary} />}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching live sales report from POS API server...</Text>
          </View>
        ) : filteredSummary.length === 0 ? (
          <View style={styles.emptyBox}>
            <FileText size={44} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Live Sales Records Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              No sales invoices returned for the date range ({fromDate} to {toDate}). Please select dates with active billing or tap Refresh.
            </Text>
            <TouchableOpacity style={[styles.emptyResetBtn, { backgroundColor: theme.primary }]} onPress={onRefetchData}>
              <Text style={styles.emptyResetBtnText}>Refetch API Data</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredSummary.map((row, index) => {
            const invNo = row.invoice_no || row.bill_no || `INV-${index + 1}`;
            const amount = Number(row.total_amount || row.net_amount || row.grand_total || 0);
            const isReturn =
              String(row.doc_type) === '3' ||
              String(row.doc_type_name).toLowerCase().includes('return') ||
              invNo.startsWith('R');
            const isB2B =
              String(row.doc_type) === '2' ||
              invNo.startsWith('B') ||
              Boolean(row.customer_gstin);

            return (
              <TouchableOpacity
                key={invNo + '-' + index}
                style={[styles.invoiceItemCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => onOpenInvoiceModal(row)}
                activeOpacity={0.7}
              >
                {/* Invoice Card Header */}
                <View style={styles.invoiceItemHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.invNoText, { color: theme.textPrimary }]}>{invNo}</Text>
                      <Badge
                        label={isReturn ? 'RETURN' : isB2B ? 'B2B' : 'RETAIL'}
                        variant={isReturn ? 'warning' : isB2B ? 'info' : 'success'}
                      />
                    </View>
                    <Text style={[styles.invDateText, { color: theme.textSecondary }]}>
                      {formatDateTimeDisplay(row.pos_bill_saved_at || row.created_at)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.invAmountText, isReturn ? { color: '#ef4444' } : { color: isDark ? '#6ee7b7' : '#16a34a' }]}>
                      {isReturn ? '-' : ''}
                      {formatCurrency(amount)}
                    </Text>
                    <Text style={[styles.invQtyText, { color: theme.textMuted }]}>{row.total_qty || 1} Pcs</Text>
                  </View>
                </View>

                {/* Metadata Tags */}
                <View style={styles.invMetaRow}>
                  <View style={[styles.metaChip, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
                    <User size={10} color={theme.textMuted} style={{ marginRight: 3 }} />
                    <Text style={[styles.metaChipText, { color: theme.textPrimary }]}>
                      {row.cashier_name || row.user_id || 'Cashier'}
                    </Text>
                  </View>

                  {row.terminal_code ? (
                    <View style={[styles.metaChip, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
                      <Text style={[styles.metaChipLabel, { color: theme.textMuted }]}>Term:</Text>
                      <Text style={[styles.metaChipText, { color: theme.textPrimary }]}>{row.terminal_code}</Text>
                    </View>
                  ) : null}

                  {row.customer_name ? (
                    <View style={[styles.metaChip, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
                      <Text style={[styles.metaChipLabel, { color: theme.textMuted }]}>Cust:</Text>
                      <Text style={[styles.metaChipText, { color: theme.textPrimary }]}>{row.customer_name}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Tax & Breakdown footer */}
                <View style={[styles.invCardFooter, { borderTopColor: theme.divider }]}>
                  <View style={styles.taxBreakdownRow}>
                    <Text style={[styles.taxBreakdownText, { color: theme.textMuted }]}>
                      Taxable: <Text style={[styles.taxBreakdownBold, { color: theme.textSecondary }]}>{formatCurrency(row.taxable_amount)}</Text>
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={[styles.taxBreakdownText, { color: theme.textMuted }]}>
                      GST: <Text style={[styles.taxBreakdownBold, { color: theme.textSecondary }]}>{formatCurrency(row.tax_amount)}</Text>
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={[styles.taxBreakdownText, { color: theme.textMuted }]}>
                      Disc: <Text style={[styles.taxBreakdownBold, { color: theme.textSecondary }]}>{formatCurrency(row.total_discount)}</Text>
                    </Text>
                  </View>

                  <View style={styles.viewItemsBtn}>
                    <Text style={[styles.viewItemsText, { color: theme.primary }]}>View Items</Text>
                    <ChevronRight size={13} color={theme.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    paddingVertical: 0,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 10,
    fontWeight: '500',
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
  emptyResetBtn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyResetBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  invoiceItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  invoiceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invNoText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  invDateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  invAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
  },
  invQtyText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  invMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaChipLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginRight: 3,
  },
  metaChipText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '700',
  },
  invCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  taxBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  taxBreakdownText: {
    fontSize: 10,
    color: '#64748b',
  },
  taxBreakdownBold: {
    fontWeight: '700',
    color: '#334155',
  },
  dotSeparator: {
    fontSize: 10,
    color: '#cbd5e1',
    marginHorizontal: 4,
  },
  viewItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewItemsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
});
