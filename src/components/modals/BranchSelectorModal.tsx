import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Building2, Search, X, Check, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BranchItem } from '../../api/comparisonApi';

export interface BranchSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  branches: BranchItem[];
  selectedBranchCodes: string[];
  onApply: (selectedCodes: string[]) => void;
  title?: string;
}

export const BranchSelectorModal: React.FC<BranchSelectorModalProps> = ({
  visible,
  onClose,
  branches,
  selectedBranchCodes,
  onApply,
  title = 'Select Stores',
}) => {
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tempSelectedCodes, setTempSelectedCodes] = useState<string[]>(selectedBranchCodes);

  // Sync temp selection immediately when modal becomes visible
  useEffect(() => {
    if (visible) {
      setTempSelectedCodes(selectedBranchCodes);
      setSearchQuery('');
    }
  }, [visible, selectedBranchCodes]);

  // Sort & Filter: Selected branches ALWAYS come to the top!
  const sortedAndFilteredBranches = useMemo(() => {
    let list = branches;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = branches.filter(
        (b) => b.branch_code.toLowerCase().includes(q) || b.branch_name.toLowerCase().includes(q)
      );
    }
    // Sort so selected branches appear FIRST at the top
    return [...list].sort((a, b) => {
      const aSelected = tempSelectedCodes.includes(a.branch_code);
      const bSelected = tempSelectedCodes.includes(b.branch_code);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.branch_name.localeCompare(b.branch_name);
    });
  }, [branches, searchQuery, tempSelectedCodes]);

  // Extract array of selected branch items for top summary
  const selectedBranchItems = useMemo(() => {
    return branches.filter((b) => tempSelectedCodes.includes(b.branch_code));
  }, [branches, tempSelectedCodes]);

  if (!visible) return null;

  const toggleBranch = (code: string) => {
    setTempSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectAll = () => {
    if (branches.length > 0) {
      setTempSelectedCodes(branches.map((b) => b.branch_code));
    }
  };

  const clearAll = () => {
    setTempSelectedCodes([]);
  };

  const handleApply = () => {
    onClose();
    onApply(tempSelectedCodes);
  };

  return (
    <View style={styles.overlayContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Building2 size={18} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Selected Branches Summary Pills Bar (If any selected) */}
              {selectedBranchItems.length > 0 && (
                <View style={[styles.selectedSummaryBox, { backgroundColor: isDark ? '#1e293b' : '#f0f9ff', borderColor: isDark ? '#334155' : '#bae6fd' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <CheckCircle2 size={13} color={theme.primary} style={{ marginRight: 5 }} />
                    <Text style={[styles.selectedSummaryTitle, { color: theme.primary }]}>
                      Selected Stores ({selectedBranchItems.length} of {branches.length})
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedPillsScroll}>
                    {selectedBranchItems.map((b) => (
                      <TouchableOpacity
                        key={b.branch_code}
                        style={[styles.selectedPill, { backgroundColor: theme.primary }]}
                        onPress={() => toggleBranch(b.branch_code)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.selectedPillText} numberOfLines={1}>{b.branch_name}</Text>
                        <X size={11} color="#ffffff" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Branch Search Input */}
              <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Search size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  placeholder="Search branch code or name..."
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Chips */}
              <View style={styles.actionChipRow}>
                <TouchableOpacity
                  style={[styles.actionChip, { backgroundColor: theme.primaryLight }]}
                  onPress={selectAll}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionChipText, { color: theme.primary }]}>
                    Select All ({branches.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionChip, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}
                  onPress={clearAll}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionChipText, { color: theme.textSecondary }]}>Clear All</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable Branch List — Selected ones stay at top */}
              <ScrollView style={styles.branchList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {sortedAndFilteredBranches.map((b, idx) => {
                  const isSelected = tempSelectedCodes.includes(b.branch_code);
                  const showUnselectedHeader =
                    idx > 0 &&
                    !isSelected &&
                    tempSelectedCodes.includes(sortedAndFilteredBranches[idx - 1].branch_code);

                  return (
                    <React.Fragment key={b.branch_code}>
                      {showUnselectedHeader && (
                        <View style={styles.sectionDividerRow}>
                          <Text style={[styles.sectionDividerText, { color: theme.textMuted }]}>
                            OTHER AVAILABLE STORES ({branches.length - tempSelectedCodes.length})
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.branchRow,
                          { borderBottomColor: theme.divider },
                          isSelected && { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff', borderColor: theme.primaryLight },
                        ]}
                        onPress={() => toggleBranch(b.branch_code)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.branchName, { color: theme.textPrimary }, isSelected && { fontWeight: '800' }]}>
                              {b.branch_name}
                            </Text>
                            {isSelected && (
                              <View style={[styles.selectedBadge, { backgroundColor: theme.primaryLight }]}>
                                <Text style={[styles.selectedBadgeText, { color: theme.primary }]}>SELECTED</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.branchCode, { color: theme.textSecondary }]}>
                            Code: {b.branch_code} {b.city ? `• ${b.city}` : ''}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: isSelected ? theme.primary : theme.border },
                            isSelected && { backgroundColor: theme.primary },
                          ]}
                        >
                          {isSelected && <Check size={13} color="#ffffff" />}
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </ScrollView>

              {/* Modal Apply Footer */}
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                onPress={handleApply}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>
                  Apply ({tempSelectedCodes.length}) Branch(es) & Fetch Data
                </Text>
              </TouchableOpacity>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    maxHeight: '85%',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  selectedSummaryBox: {
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  selectedSummaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  selectedPillsScroll: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 160,
  },
  selectedPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  actionChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  branchList: {
    maxHeight: 280,
    marginBottom: 12,
  },
  sectionDividerRow: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  sectionDividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  branchName: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  branchCode: {
    fontSize: 11,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
