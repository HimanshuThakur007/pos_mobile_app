import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { useTheme } from '../../context/ThemeContext';
import { TOP_SELLING_POS_ITEMS } from '../../data/posSalesMockData';
import { POSTransaction } from '../../types/posSales';

interface QuickPOSTerminalModalProps {
  visible: boolean;
  onClose: () => void;
  onCompleteSale: (newTx: POSTransaction) => void;
}

export const QuickPOSTerminalModal: React.FC<QuickPOSTerminalModalProps> = ({
  visible,
  onClose,
  onCompleteSale,
}) => {
  const { theme } = useTheme();
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({
    'SKU-9901': 1,
  });
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI / GPay / PhonePe');
  const [cashierName, setCashierName] = useState<string>('Priya Sharma');
  const [storeName, setStoreName] = useState<string>('DLF Mall of India');

  const paymentOptions = [
    'UPI / GPay / PhonePe',
    'Credit / Debit Card',
    'Cash (INR)',
    'Store Gift Voucher',
  ];

  const toggleItemQty = (id: string, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((sum, [id, qty]) => {
      const item = TOP_SELLING_POS_ITEMS.find((i) => i.id === id);
      return sum + (item ? (item.revenue / item.unitsSold) * qty : 0);
    }, 0);
  };

  const totalAmount = calculateTotal();
  const totalItemCount = Object.values(selectedItems).reduce((a, b) => a + b, 0);

  const handleCheckout = () => {
    if (totalItemCount === 0) {
      if (Platform.OS === 'web') {
        alert('Please select at least one item to checkout.');
      } else {
        Alert.alert('Empty Cart', 'Please select at least one item.');
      }
      return;
    }

    const newTx: POSTransaction = {
      id: `TX-POS-${Math.floor(8000 + Math.random() * 1000)}`,
      terminalId: `POS-01 (${storeName.split(' ')[0]})`,
      storeName: storeName,
      cashier: cashierName,
      itemsCount: totalItemCount,
      amount: totalAmount,
      paymentMethod: paymentMethod,
      timestamp: 'Just now',
      status: 'Completed',
    };

    onCompleteSale(newTx);
    onClose();
    if (Platform.OS === 'web') {
      alert(`POS Sale Processed Successfully!\nReceipt: ${newTx.id} - ₹${totalAmount.toFixed(2)}`);
    } else {
      Alert.alert('Sale Processed!', `Receipt #${newTx.id} generated for ₹${totalAmount.toFixed(2)}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Mobile POS Checkout Register</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Select items & process live tender receipt</Text>
            </View>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.subtleBoxBg }]} onPress={onClose}>
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Select Merchandise SKUs */}
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Select Merchandise SKUs</Text>
            {TOP_SELLING_POS_ITEMS.map((item) => {
              const qty = selectedItems[item.id] || 0;
              const unitPrice = item.revenue / item.unitsSold;

              return (
                <View key={item.id} style={[styles.itemRow, { borderBottomColor: theme.divider }]}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemSub, { color: theme.textSecondary }]}>
                      {item.sku} • ₹{unitPrice.toFixed(0)} / unit
                    </Text>
                  </View>

                  <View style={[styles.qtyControl, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => toggleItemQty(item.id, -1)}
                    >
                      <Text style={[styles.qtyBtnText, { color: theme.primary }]}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: theme.textPrimary }]}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => toggleItemQty(item.id, 1)}
                    >
                      <Text style={[styles.qtyBtnText, { color: theme.primary }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Payment Method Selector */}
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Payment Tender Method</Text>
            <View style={styles.paymentGrid}>
              {paymentOptions.map((opt) => {
                const isSelected = paymentMethod === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.paymentChip,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.subtleBoxBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setPaymentMethod(opt)}
                  >
                    <Text
                      style={[
                        styles.paymentChipText,
                        { color: isSelected ? theme.primary : theme.textSecondary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Checkout Summary */}
          <View style={[styles.footer, { backgroundColor: theme.cardBg, borderTopColor: theme.divider }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{totalItemCount} Items Total</Text>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{totalAmount.toFixed(2)}</Text>
            </View>

            <Button
              title={`💳 Process Sale • ₹${totalAmount.toFixed(2)}`}
              onPress={handleCheckout}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 8,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  paymentChip: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  activePaymentChip: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  paymentChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  activePaymentChipText: {
    color: '#2563eb',
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
});
