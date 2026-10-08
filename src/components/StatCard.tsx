import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { useTheme } from '../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: IconComponent,
  iconColor = '#2563eb',
}) => {
  const { theme, isDark } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleWithIcon}>
          {IconComponent && (
            <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.primaryLight : '#eff6ff' }]}>
              <IconComponent size={14} color={iconColor} />
            </View>
          )}
          <Text style={[styles.titleText, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
        {change ? (
          <View
            style={[
              styles.badge,
              isPositive
                ? { backgroundColor: theme.statusLiveBg, borderColor: 'transparent' }
                : { backgroundColor: theme.statusOfflineBg, borderColor: 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isPositive ? theme.statusLiveText : theme.statusOfflineText },
              ]}
            >
              {isPositive ? '▲' : '▼'} {change}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[styles.valueText, { color: theme.textPrimary }]}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>

      {subtitle ? (
        <Text style={[styles.subtitleText, { color: theme.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
          {subtitle}
        </Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  titleWithIcon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  positiveBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  negativeBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  positiveText: {
    color: '#047857',
  },
  negativeText: {
    color: '#b91c1c',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.6,
  },
  subtitleText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
});
