import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { WifiOff, RefreshCw, AlertCircle, X, ChevronRight, Signal, ShieldAlert } from 'lucide-react-native';
import { useNetwork } from '../context/NetworkContext';
import { useTheme } from '../context/ThemeContext';

export const OfflineNotice: React.FC = () => {
  const { isOnline, isChecking, checkConnection } = useNetwork();
  const { theme, isDark } = useTheme();
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  if (isOnline) {
    return null;
  }

  const handleRetry = async () => {
    const onlineNow = await checkConnection();
    if (onlineNow) {
      setShowDetailModal(false);
    }
  };

  return (
    <>
      {/* ── Top Floating Offline Banner Bar ── */}
      <TouchableOpacity
        style={[
          styles.bannerContainer,
          {
            backgroundColor: isDark ? '#7f1d1d' : '#991b1b',
            borderColor: isDark ? '#b91c1c' : '#dc2626',
          },
        ]}
        onPress={() => setShowDetailModal(true)}
        activeOpacity={0.9}
      >
        <View style={styles.bannerLeft}>
          <View style={styles.bannerIconBadge}>
            <WifiOff size={16} color="#ffffff" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>No Internet Connection</Text>
            <Text style={styles.bannerSub}>Tap for details or troubleshooting</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={handleRetry}
          disabled={isChecking}
          activeOpacity={0.7}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <RefreshCw size={13} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>

      {/* ── Full Detail Modal Dialog ── */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDetailModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowDetailModal(false)}
                >
                  <X size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* Header Badge */}
                <View
                  style={[
                    styles.modalIconCircle,
                    { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' },
                  ]}
                >
                  <WifiOff size={36} color={isDark ? '#fca5a5' : '#dc2626'} />
                </View>

                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  No Internet Connection
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  We cannot reach the Market99 POS servers. Please check your network settings and try again.
                </Text>

                {/* Troubleshooting Checklist */}
                <View
                  style={[
                    styles.checklistCard,
                    {
                      backgroundColor: theme.subtleBoxBg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.checkItem}>
                    <Signal size={15} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.checkText, { color: theme.textPrimary }]}>
                      Ensure Wi-Fi or Mobile Data is turned on
                    </Text>
                  </View>
                  <View style={[styles.checkDivider, { backgroundColor: theme.divider }]} />
                  <View style={styles.checkItem}>
                    <ShieldAlert size={15} color="#b45309" style={{ marginRight: 8 }} />
                    <Text style={[styles.checkText, { color: theme.textPrimary }]}>
                      Check if aeroplane mode is enabled
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                  onPress={handleRetry}
                  disabled={isChecking}
                  activeOpacity={0.8}
                >
                  {isChecking ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <RefreshCw size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryActionText}>Try Again Now</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { borderColor: theme.border }]}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={[styles.secondaryActionText, { color: theme.textSecondary }]}>
                    Dismiss & Continue Offline
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 12,
    right: 12,
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  bannerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  checklistCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  checkDivider: {
    height: 1,
    marginVertical: 8,
  },
  primaryActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
