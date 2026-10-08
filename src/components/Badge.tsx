import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'default';
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', showDot = false }) => {
  const { theme, isDark } = useTheme();

  const darkVariantStyles = {
    default: { bg: '#3a3b3c', border: '#4e4f50', text: '#e4e6eb', dot: '#b0b3b8' },
    success: { bg: '#064e3b', border: '#065f46', text: '#6ee7b7', dot: '#34d399' },
    warning: { bg: '#78350f', border: '#92400e', text: '#fde047', dot: '#facc15' },
    info: { bg: '#1e3a8a', border: '#1e40af', text: '#93c5fd', dot: '#60a5fa' },
    danger: { bg: '#7f1d1d', border: '#991b1b', text: '#fca5a5', dot: '#f87171' },
  };

  const dynamicBg = isDark ? darkVariantStyles[variant].bg : undefined;
  const dynamicBorder = isDark ? darkVariantStyles[variant].border : undefined;
  const dynamicText = isDark ? darkVariantStyles[variant].text : undefined;
  const dynamicDot = isDark ? darkVariantStyles[variant].dot : undefined;

  return (
    <View
      style={[
        styles.badge,
        styles[variant],
        dynamicBg ? { backgroundColor: dynamicBg, borderColor: dynamicBorder } : null,
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            styles[`${variant}Dot`],
            dynamicDot ? { backgroundColor: dynamicDot } : null,
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          styles[`${variant}Text`],
          dynamicText ? { color: dynamicText } : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  default: {
    backgroundColor: '#f0f2f5',
    borderColor: '#e4e6eb',
  },
  success: {
    backgroundColor: '#e6f4ea',
    borderColor: '#ceead6',
  },
  warning: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  info: {
    backgroundColor: '#e7f3ff',
    borderColor: '#c0e0ff',
  },
  danger: {
    backgroundColor: '#fce8e6',
    borderColor: '#fad2cf',
  },
  defaultDot: {
    backgroundColor: '#65676b',
  },
  successDot: {
    backgroundColor: '#137333',
  },
  warningDot: {
    backgroundColor: '#b45309',
  },
  infoDot: {
    backgroundColor: '#1877f2',
  },
  dangerDot: {
    backgroundColor: '#c5221f',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  defaultText: {
    color: '#65676b',
  },
  successText: {
    color: '#137333',
  },
  warningText: {
    color: '#b45309',
  },
  infoText: {
    color: '#1877f2',
  },
  dangerText: {
    color: '#c5221f',
  },
});
