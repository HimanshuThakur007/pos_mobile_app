import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { TrendingUp, Target, Zap } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface MISRunRateWidgetProps {
  eomTarget: number;
  eomForecast: number;
  currentRevenue: number;
}

export const MISRunRateWidget: React.FC<MISRunRateWidgetProps> = ({
  eomTarget,
  eomForecast,
  currentRevenue,
}) => {
  const { theme, isDark } = useTheme();

  const percentAttained = ((eomForecast / eomTarget) * 100).toFixed(1);
  const formattedTarget = `₹${(eomTarget / 10000000).toFixed(2)} Cr`;
  const formattedForecast = `₹${(eomForecast / 10000000).toFixed(2)} Cr`;
  const formattedCurrent = `₹${(currentRevenue / 100000).toFixed(2)} Lakhs`;

  const mtdPace = Math.min((currentRevenue / eomTarget) * 100, 100);

  return (
    <Card style={styles.card}>
      {/* Top Gradient Stripe */}
      <View style={[styles.topBarAccent, { backgroundColor: theme.primary }]} />

      {/* Header Section */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
            <TrendingUp size={20} color={theme.primary} strokeWidth={2.5} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              C-Suite EOM Forecast
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              Target vs Projected Revenue Run-Rate
            </Text>
          </View>
        </View>

        <Badge label={`${percentAttained}% Pace`} variant="success" showDot />
      </View>

      {/* Side-by-Side Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricBox, { backgroundColor: theme.subtleBoxBg, borderColor: theme.border }]}>
          <View style={styles.boxTitleRow}>
            <Target size={14} color={theme.textMuted} />
            <Text style={[styles.boxLabel, { color: theme.textMuted }]}>Monthly Target</Text>
          </View>
          <Text style={[styles.boxValue, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
            {formattedTarget}
          </Text>
          <Text style={[styles.boxSubtext, { color: theme.textMuted }]}>Set Budget Baseline</Text>
        </View>

        <View style={[styles.metricBox, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#065f46' : '#bbf7d0' }]}>
          <View style={styles.boxTitleRow}>
            <Zap size={14} color={isDark ? '#6ee7b7' : '#16a34a'} />
            <Text style={[styles.boxLabel, { color: isDark ? '#6ee7b7' : '#16a34a' }]}>Projected EOM</Text>
          </View>
          <Text style={[styles.boxValue, { color: isDark ? '#6ee7b7' : '#15803d' }]} numberOfLines={1} adjustsFontSizeToFit>
            {formattedForecast}
          </Text>
          <Text style={[styles.boxSubtext, { color: isDark ? '#6ee7b7' : '#16a34a' }]}>▲ +7.3% Exceeding</Text>
        </View>
      </View>

      {/* Visual Multi-Phase Progress Bar */}
      <View style={[styles.gaugeContainer, { backgroundColor: theme.subtleBoxBg, borderTopColor: theme.divider }]}>
        <View style={styles.gaugeHeader}>
          <Text style={[styles.gaugeTitle, { color: theme.textSecondary }]}>Month-to-Date Progress</Text>
          <Text style={[styles.gaugeValue, { color: theme.primary }]}>{formattedCurrent}</Text>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: isDark ? '#3a3b3c' : '#e2e8f0' }]}>
          {/* MTD Revenue Fill */}
          <View style={[styles.mtdFill, { width: `${mtdPace}%`, backgroundColor: theme.primary }]} />
          {/* Projected Target Marker Fill */}
          <View style={[styles.forecastFill, { width: `${Math.min(Number(percentAttained), 100)}%` }]} />
        </View>

        <View style={styles.milestoneRow}>
          <Text style={[styles.milestoneText, { color: theme.textMuted }]}>MTD Today</Text>
          <Text style={[styles.milestoneText, { color: theme.textMuted }]}>Monthly Target</Text>
          <Text style={[styles.milestoneText, { color: isDark ? '#6ee7b7' : '#15803d', fontWeight: '800' }]}>
            EOM Pace
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  topBarAccent: {
    height: 4,
    backgroundColor: '#2563eb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  targetBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  forecastBox: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  boxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  boxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  boxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  boxSubtext: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  gaugeContainer: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gaugeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  gaugeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6,
  },
  mtdFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
    zIndex: 2,
  },
  forecastFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#10b981',
    borderRadius: 4,
    zIndex: 1,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestoneText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
