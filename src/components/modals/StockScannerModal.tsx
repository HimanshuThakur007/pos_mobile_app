import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { TOP_SELLING_POS_ITEMS } from '../../data/posSalesMockData';
import { useTheme } from '../../context/ThemeContext';

interface StockScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdateStock: (sku: string, newStock: number) => void;
}

export const StockScannerModal: React.FC<StockScannerModalProps> = ({
  visible,
  onClose,
  onUpdateStock,
}) => {
  const { theme, isDark } = useTheme();
  const [selectedSku, setSelectedSku] = useState<string>('ETH-W-102');
  const [stockAdjustment, setStockAdjustment] = useState<string>('10');
  const [reason, setReason] = useState<string>('New Shipment Arrival');

  const selectedItem = TOP_SELLING_POS_ITEMS.find((i) => i.sku === selectedSku) || TOP_SELLING_POS_ITEMS[0];

  const handleSaveStock = () => {
    const qty = parseInt(stockAdjustment, 10);
    if (isNaN(qty) || qty === 0) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid stock adjustment quantity.');
      } else {
        Alert.alert('Invalid Quantity', 'Please enter a valid number.');
      }
      return;
    }

    onUpdateStock(selectedSku, qty);
    onClose();

    if (Platform.OS === 'web') {
      alert(`Stock Audit Updated!\nSKU ${selectedSku}: Added ${qty} units (${reason}).`);
    } else {
      Alert.alert('Stock Updated!', `SKU ${selectedSku}: Added ${qty} units (${reason}).`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>📷 Barcode Scanner & Stock Adjuster</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Scan SKU & perform instant stock audit</Text>
            </View>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.subtleBoxBg }]} onPress={onClose}>
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Simulated Scanner Viewfinder */}
            <View style={[styles.viewfinder, { backgroundColor: isDark ? '#111827' : '#0f172a' }]}>
              <Text style={styles.scannerIcon}>📷</Text>
              <Text style={styles.viewfinderText}>Align Barcode / QR Code inside box</Text>
              <Badge label="SCANNER READY" variant="success" showDot />
            </View>

            {/* Select SKU to Adjust */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Select Merchandise SKU</Text>
            {TOP_SELLING_POS_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.sku}
                style={[
                  styles.skuRow,
                  { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                  selectedSku === item.sku && { backgroundColor: isDark ? '#263951' : '#eff6ff', borderColor: theme.primary },
                ]}
                onPress={() => setSelectedSku(item.sku)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.skuName, { color: theme.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.skuSub, { color: theme.textSecondary }]}>{item.sku} • {item.category}</Text>
                </View>
                {selectedSku === item.sku && <Badge label="SELECTED" variant="info" />}
              </TouchableOpacity>
            ))}

            {/* Stock Quantity Input */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Stock Adjustment Quantity (+/-)</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.qtyInput, { color: theme.textPrimary }]}
                value={stockAdjustment}
                onChangeText={setStockAdjustment}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </ScrollView>

          {/* Footer Save Action */}
          <View style={[styles.footer, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
            <Button title="💾 Save Stock Audit Update" onPress={handleSaveStock} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
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
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 18,
  },
  viewfinder: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
  scannerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  viewfinderText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  skuName: {
    fontSize: 13,
    fontWeight: '700',
  },
  skuSub: {
    fontSize: 11,
    marginTop: 2,
  },
  inputContainer: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  qtyInput: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
  },
});
