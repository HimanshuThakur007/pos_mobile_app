import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X, Check } from 'lucide-react-native';
import { formatDateToYYYYMMDD } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

export interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  title?: string;
  embedInModal?: boolean;
}

type PickerViewMode = 'DAYS' | 'MONTHS' | 'YEARS';

const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const YEARS = Array.from({ length: 16 }, (_, i) => 2020 + i);

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  value,
  onSelectDate,
  title = 'Select Date',
  embedInModal = false,
}) => {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());
  const [viewMode, setViewMode] = useState<PickerViewMode>('DAYS');

  useEffect(() => {
    setViewMode('DAYS');
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const parsed = new Date(y, m, d);
          setSelectedDate(parsed);
          setViewYear(y);
          setViewMonth(m);
          return;
        }
      }
    }
    const today = new Date();
    setSelectedDate(today);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }, [value, visible]);

  if (!visible) return null;

  const changeMonth = (offset: number) => {
    let newM = viewMonth + offset;
    let newY = viewYear;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    } else if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setViewMonth(newM);
    setViewYear(newY);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDaySelect = (dayNum: number) => {
    const d = new Date(viewYear, viewMonth, dayNum);
    setSelectedDate(d);
  };

  const handleConfirm = () => {
    const formatted = formatDateToYYYYMMDD(selectedDate);
    onSelectDate(formatted);
    onClose();
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyLeadingCells = Array.from({ length: firstDay }, (_, i) => i);

  const modalBody = (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Calendar size={18} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{title}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation Header with Selectors */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                style={[styles.navArrow, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}
                onPress={() => changeMonth(-1)}
              >
                <ChevronLeft size={18} color={theme.textPrimary} />
              </TouchableOpacity>

              <View style={styles.selectorGroup}>
                {/* Month Selector Pill */}
                <TouchableOpacity
                  style={[
                    styles.selectorPill,
                    { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                    viewMode === 'MONTHS' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setViewMode(viewMode === 'MONTHS' ? 'DAYS' : 'MONTHS')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorPillText,
                      { color: theme.textPrimary },
                      viewMode === 'MONTHS' && { color: '#ffffff', fontWeight: '800' },
                    ]}
                  >
                    {MONTH_SHORT_NAMES[viewMonth]}
                  </Text>
                  <ChevronDown
                    size={13}
                    color={viewMode === 'MONTHS' ? '#ffffff' : theme.textMuted}
                    style={{ marginLeft: 3 }}
                  />
                </TouchableOpacity>

                {/* Year Selector Pill */}
                <TouchableOpacity
                  style={[
                    styles.selectorPill,
                    { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                    viewMode === 'YEARS' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setViewMode(viewMode === 'YEARS' ? 'DAYS' : 'YEARS')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorPillText,
                      { color: theme.textPrimary },
                      viewMode === 'YEARS' && { color: '#ffffff', fontWeight: '800' },
                    ]}
                  >
                    {viewYear}
                  </Text>
                  <ChevronDown
                    size={13}
                    color={viewMode === 'YEARS' ? '#ffffff' : theme.textMuted}
                    style={{ marginLeft: 3 }}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.navArrow, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}
                onPress={() => changeMonth(1)}
              >
                <ChevronRight size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* MONTH SELECTION GRID VIEW */}
            {viewMode === 'MONTHS' && (
              <View style={styles.gridContainer}>
                <Text style={[styles.gridSectionTitle, { color: theme.textSecondary }]}>
                  Select Month ({viewYear})
                </Text>
                <View style={styles.monthGrid}>
                  {MONTH_SHORT_NAMES.map((mName, idx) => {
                    const isSelected = viewMonth === idx;
                    return (
                      <TouchableOpacity
                        key={mName}
                        style={[
                          styles.monthGridCell,
                          { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                        onPress={() => {
                          setViewMonth(idx);
                          setViewMode('DAYS');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.gridCellText,
                            { color: theme.textPrimary },
                            isSelected && { color: '#ffffff', fontWeight: '800' },
                          ]}
                        >
                          {mName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* YEAR SELECTION GRID VIEW */}
            {viewMode === 'YEARS' && (
              <View style={styles.gridContainer}>
                <Text style={[styles.gridSectionTitle, { color: theme.textSecondary }]}>Select Year</Text>
                <ScrollView style={{ maxHeight: 210 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.yearGrid}>
                    {YEARS.map((yVal) => {
                      const isSelected = viewYear === yVal;
                      return (
                        <TouchableOpacity
                          key={yVal}
                          style={[
                            styles.yearGridCell,
                            { backgroundColor: theme.subtleBoxBg, borderColor: theme.border },
                            isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                          ]}
                          onPress={() => {
                            setViewYear(yVal);
                            setViewMode('MONTHS');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.gridCellText,
                              { color: theme.textPrimary },
                              isSelected && { color: '#ffffff', fontWeight: '800' },
                            ]}
                          >
                            {yVal}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* DAYS CALENDAR GRID VIEW */}
            {viewMode === 'DAYS' && (
              <>
                {/* Day of Week Headers */}
                <View style={styles.weekDaysRow}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                    <Text key={wd} style={[styles.weekDayText, { color: theme.textMuted }]}>
                      {wd}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {emptyLeadingCells.map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}
                  {daysArray.map((dayNum) => {
                    const isSelected =
                      selectedDate.getFullYear() === viewYear &&
                      selectedDate.getMonth() === viewMonth &&
                      selectedDate.getDate() === dayNum;

                    const isToday =
                      new Date().getFullYear() === viewYear &&
                      new Date().getMonth() === viewMonth &&
                      new Date().getDate() === dayNum;

                    return (
                      <TouchableOpacity
                        key={dayNum}
                        style={[
                          styles.dayCell,
                          isSelected && { backgroundColor: theme.primary },
                          isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.primary },
                        ]}
                        onPress={() => handleDaySelect(dayNum)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: theme.textPrimary },
                            isSelected && { color: '#ffffff', fontWeight: '800' },
                            isToday && !isSelected && { color: theme.primary, fontWeight: '800' },
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Selected Result Display */}
            <View style={[styles.selectedDisplayRow, { borderTopColor: theme.divider }]}>
              <Text style={[styles.selectedDisplayText, { color: theme.textSecondary }]}>
                Selected: <Text style={[styles.boldText, { color: theme.textPrimary }]}>{formatDateToYYYYMMDD(selectedDate)}</Text>
              </Text>
            </View>

            {/* Confirm / Apply Button */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.primary }]} onPress={handleConfirm} activeOpacity={0.8}>
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>Apply Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );

  if (embedInModal) {
    return <View style={styles.embeddedContainer}>{modalBody}</View>;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {modalBody}
    </Modal>
  );
};

const styles = StyleSheet.create({
  embeddedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 999,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  selectorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectorPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  navArrow: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  gridContainer: {
    paddingVertical: 6,
    minHeight: 210,
    justifyContent: 'center',
  },
  gridSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  monthGridCell: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  yearGridCell: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellText: {
    fontSize: 13,
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedDisplayRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  selectedDisplayText: {
    fontSize: 12,
  },
  boldText: {
    fontWeight: '800',
  },
  actionRow: {
    marginTop: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
