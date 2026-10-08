import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { X } from 'lucide-react-native';
import { Badge } from '../Badge';
import { useTheme } from '../../context/ThemeContext';
import { SaleReportSummaryRow, SaleReportItemRow } from '../../types/salesReport';
import { formatCurrency, formatDateTimeDisplay } from '../../utils/formatters';

interface InvoiceDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedInvoice: SaleReportSummaryRow | null;
  activeBranchCode: string;
  isTablet: boolean;
  isLoading: boolean;
  modalItems: SaleReportItemRow[];
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  visible,
  onClose,
  selectedInvoice,
  activeBranchCode,
  isTablet,
  isLoading,
  modalItems,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.overlayContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalSheet, { backgroundColor: theme.cardBg }, isTablet && styles.modalSheetTablet]}>
              {/* Sheet Handle */}
              <View style={[styles.sheetHandle, { backgroundColor: theme.divider }]} />

              {/* Modal Header */}
              <View style={[styles.modalHeaderRow, { borderBottomColor: theme.divider }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>
                      {selectedInvoice?.invoice_no || selectedInvoice?.bill_no || 'Invoice Details'}
                    </Text>
                    <Badge label={`Branch ${selectedInvoice?.branch_code || activeBranchCode}`} variant="info" />
                  </View>
                  <Text style={[styles.modalHeaderSub, { color: theme.textSecondary }]}>
                    Saved At: {formatDateTimeDisplay(selectedInvoice?.pos_bill_saved_at || selectedInvoice?.created_at)}
                  </Text>
                </View>

                <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: theme.subtleBoxBg }]} onPress={onClose}>
                  <X size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                {/* Invoice Metadata Grid */}
                <View style={[styles.metaCardGrid, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
                  <View style={styles.metaCol}>
                    <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Cashier</Text>
                    <Text style={[styles.metaValText, { color: theme.textPrimary }]}>
                      {selectedInvoice?.cashier_name || selectedInvoice?.user_id || 'Cashier'}
                    </Text>
                  </View>

                  <View style={styles.metaCol}>
                    <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Customer</Text>
                    <Text style={[styles.metaValText, { color: theme.textPrimary }]}>
                      {selectedInvoice?.customer_name || 'Walk-in Customer'}
                    </Text>
                  </View>

                  <View style={styles.metaCol}>
                    <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Grand Total</Text>
                    <Text style={[styles.metaValHighlight, { color: theme.primary }]}>
                      {formatCurrency(selectedInvoice?.total_amount || selectedInvoice?.grand_total)}
                    </Text>
                  </View>

                  <View style={styles.metaCol}>
                    <Text style={[styles.metaLabel, { color: theme.textMuted }]}>GST Tax</Text>
                    <Text style={[styles.metaValText, { color: theme.textPrimary }]}>
                      {formatCurrency(selectedInvoice?.tax_amount)}
                    </Text>
                  </View>
                </View>

                {/* Line Items Title */}
                <Text style={[styles.itemsSectionTitle, { color: theme.textPrimary }]}>Itemized Products ({modalItems.length})</Text>

                {isLoading ? (
                  <View style={styles.modalLoadingBox}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.modalLoadingText, { color: theme.textSecondary }]}>Loading item breakdown from server API...</Text>
                  </View>
                ) : modalItems.length === 0 ? (
                  <View style={styles.modalEmptyBox}>
                    <Text style={[styles.modalEmptyText, { color: theme.textMuted }]}>No item details returned for this invoice.</Text>
                  </View>
                ) : (
                  modalItems.map((item, idx) => {
                    const code =
                      item.itemCode || item.item_code || item.ItemCode || item.sku_code || `SKU-${idx + 1}`;
                    const name =
                      item.printDesc ||
                      item.print_desc ||
                      item.itemName ||
                      item.item_name ||
                      item.description ||
                      code;
                    const qty = Number(item.qty || item.quantity || item.total_qty || 1);
                    const mrp = Number(item.mrp || item.gross_price || item.unit_price || item.price || 0);
                    const subtotal = Number(item.subtotal || item.total_amount || item.net_amount || (qty * mrp));
                    const taxPct = Number(item.tax_percent || item.tax_rate || item.gst_percent || 0);

                    return (
                      <View key={idx} style={[styles.lineItemRow, { borderBottomColor: theme.divider }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.lineItemNameText, { color: theme.textPrimary }]}>{name}</Text>
                          <Text style={[styles.lineItemCodeText, { color: theme.textMuted }]}>
                            Code: {code} {taxPct > 0 ? `• GST ${taxPct}%` : ''}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.lineItemSubtotalText, { color: theme.textPrimary }]}>{formatCurrency(subtotal)}</Text>
                          <Text style={[styles.lineItemQtyText, { color: theme.textSecondary }]}>
                            {qty} x {formatCurrency(mrp)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Modal Bottom Actions */}
              <View style={[styles.modalFooter, { borderTopColor: theme.divider }]}>
                <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]} onPress={onClose}>
                  <Text style={[styles.sheetCloseBtnText, { color: theme.textPrimary }]}>Close Invoice</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 9999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  modalSheetTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 24,
    marginBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalHeaderSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 10,
  },
  modalBodyScroll: {
    maxHeight: 400,
  },
  metaCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  metaCol: {
    flex: 1,
    minWidth: '45%',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  metaValHighlight: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  itemsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  modalLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalLoadingText: {
    fontSize: 12,
    marginTop: 8,
  },
  modalEmptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 12,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lineItemNameText: {
    fontSize: 12,
    fontWeight: '700',
  },
  lineItemCodeText: {
    fontSize: 10,
    marginTop: 2,
  },
  lineItemSubtotalText: {
    fontSize: 13,
    fontWeight: '800',
  },
  lineItemQtyText: {
    fontSize: 11,
    marginTop: 2,
  },
  modalFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 10,
  },
  sheetCloseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  sheetCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
