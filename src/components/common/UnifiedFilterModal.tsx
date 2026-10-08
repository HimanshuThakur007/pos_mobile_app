import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Filter, X, Calendar, Search } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { DatePickerModal } from '../modals/DatePickerModal';

export type DatePreset = 'TODAY' | 'YESTERDAY' | 'LAST7' | 'THIS_MONTH';

export interface UnifiedFilterModalProps {
  visible: boolean;
  title?: string;
  selectedPreset?: DatePreset | string;
  fromDate: string;
  toDate: string;
  onClose: () => void;
  onApplyPreset: (preset: DatePreset) => void;
  onPressFromDate?: () => void;
  onPressToDate?: () => void;
  onSelectDate?: (dateStr: string, target: 'FROM' | 'TO') => void;
  onApply: () => void;
  onReset: () => void;
  applyButtonText?: string;
  resetButtonText?: string;
  children?: React.ReactNode;
}

export const UnifiedFilterModal: React.FC<UnifiedFilterModalProps> = ({
  visible,
  title = 'Filter Options',
  selectedPreset = 'TODAY',
  fromDate,
  toDate,
  onClose,
  onApplyPreset,
  onPressFromDate,
  onPressToDate,
  onSelectDate,
  onApply,
  onReset,
  applyButtonText = 'Apply Filters',
  resetButtonText = 'Reset',
  children,
}) => {
  const { theme } = useTheme();
  const [internalPickerTarget, setInternalPickerTarget] = useState<'FROM' | 'TO' | null>(null);

  useEffect(() => {
    if (!visible) {
      setInternalPickerTarget(null);
    }
  }, [visible]);

  if (!visible) return null;

  const handlePressFrom = () => {
    setInternalPickerTarget('FROM');
  };

  const handlePressTo = () => {
    setInternalPickerTarget('TO');
  };

  const handleDateSelected = (newDateStr: string) => {
    if (onSelectDate && internalPickerTarget) {
      onSelectDate(newDateStr, internalPickerTarget);
    }
    setInternalPickerTarget(null);
  };

  return (
    <View style={styles.overlayContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Filter size={18} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Quick Date Range Presets */}
              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>Date Range Presets</Text>
              <View style={styles.modalPresetsRow}>
                <TouchableOpacity
                  style={[
                    styles.presetPillModal,
                    { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                    selectedPreset === 'TODAY' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => onApplyPreset('TODAY')}
                >
                  <Text style={[styles.presetTextModal, { color: theme.textSecondary }, selectedPreset === 'TODAY' && styles.presetTextModalActive]}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetPillModal,
                    { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                    selectedPreset === 'YESTERDAY' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => onApplyPreset('YESTERDAY')}
                >
                  <Text style={[styles.presetTextModal, { color: theme.textSecondary }, selectedPreset === 'YESTERDAY' && styles.presetTextModalActive]}>Yesterday</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetPillModal,
                    { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                    selectedPreset === 'LAST7' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => onApplyPreset('LAST7')}
                >
                  <Text style={[styles.presetTextModal, { color: theme.textSecondary }, selectedPreset === 'LAST7' && styles.presetTextModalActive]}>7 Days</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetPillModal,
                    { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                    selectedPreset === 'THIS_MONTH' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => onApplyPreset('THIS_MONTH')}
                >
                  <Text style={[styles.presetTextModal, { color: theme.textSecondary }, selectedPreset === 'THIS_MONTH' && styles.presetTextModalActive]}>1 Month</Text>
                </TouchableOpacity>
              </View>

              {/* From / To Date Inputs */}
              <View style={styles.modalDateRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>From Date</Text>
                  <TouchableOpacity
                    style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    onPress={handlePressFrom}
                    activeOpacity={0.7}
                  >
                    <Calendar size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.datePickerText, { color: theme.textPrimary }]}>{fromDate}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>To Date</Text>
                  <TouchableOpacity
                    style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    onPress={handlePressTo}
                    activeOpacity={0.7}
                  >
                    <Calendar size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.datePickerText, { color: theme.textPrimary }]}>{toDate}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Screen-Specific Custom Filter Controls Slot */}
              {children}

              {/* Footer Actions */}
              <View style={[styles.modalFooterRow, { borderTopColor: theme.divider }]}>
                <TouchableOpacity
                  style={[styles.modalApplyBtn, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    onClose();
                    onApply();
                  }}
                >
                  <Search size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.modalApplyBtnText}>{applyButtonText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalResetBtn, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}
                  onPress={onReset}
                >
                  <X size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.modalResetBtnText, { color: theme.textPrimary }]}>{resetButtonText}</Text>
                </TouchableOpacity>
              </View>

              {/* EMBEDDED DATE PICKER OVERLAY — Completely prevents iOS native modal responder freeze */}
              <DatePickerModal
                visible={internalPickerTarget !== null}
                embedInModal={true}
                value={internalPickerTarget === 'FROM' ? fromDate : toDate}
                title={internalPickerTarget === 'FROM' ? 'Select From Date' : 'Select To Date'}
                onClose={() => setInternalPickerTarget(null)}
                onSelectDate={handleDateSelected}
              />
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
    zIndex: 99999,
    elevation: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    maxHeight: '85%',
    position: 'relative',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetPillModal: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  presetTextModal: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetTextModalActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  modalDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  datePickerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  modalApplyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
  },
  modalApplyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
