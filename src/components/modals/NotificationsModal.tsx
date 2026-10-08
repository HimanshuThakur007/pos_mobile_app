import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Badge } from '../Badge';
import { useTheme } from '../../context/ThemeContext';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();

  const notifications = [
    { id: '1', title: '⚡ Peak Velocity Alert', desc: 'DLF Mall Noida reached 398 receipts/hr during 2:00 PM peak.', time: '10 mins ago', type: 'success' },
    { id: '2', title: '⚠️ Low Stock Warning', desc: 'Noise ColorFit Smartwatch (ELE-A-405) below min threshold (12 units remaining).', time: '25 mins ago', type: 'warning' },
    { id: '3', title: '💳 High Value POS Receipt', desc: 'TX-POS-8904 processed for ₹3,208.00 via Credit Card at Express Avenue.', time: '45 mins ago', type: 'info' },
    { id: '4', title: '👑 EOM Target Milestone', desc: 'Projected EOM Run-rate reached 107.3% attainment pace.', time: '2 hours ago', type: 'success' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>System Alerts & Notifications</Text>
              <Badge label="4 NEW" variant="danger" />
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {notifications.map((n) => (
              <View key={n.id} style={[styles.notifRow, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, { color: theme.textPrimary }]}>{n.title}</Text>
                  <Text style={[styles.notifTime, { color: theme.textMuted }]}>{n.time}</Text>
                </View>
                <Text style={[styles.notifDesc, { color: theme.textSecondary }]}>{n.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  notifRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  notifTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  notifDesc: {
    fontSize: 12,
    color: '#475569',
  },
});
