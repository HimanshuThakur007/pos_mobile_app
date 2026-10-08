import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
      <View style={styles.titleSection}>
        <Text style={[styles.titleText, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitleText, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.metaSection}>
        {user && (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitleText: {
    fontSize: 13,
    marginTop: 2,
  },
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
