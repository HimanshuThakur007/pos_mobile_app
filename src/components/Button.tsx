import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon: IconComponent,
  style,
  textStyle,
}) => {
  const { theme, isDark } = useTheme();
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  
  const iconColor = isOutline || isSecondary ? theme.textPrimary : '#ffffff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variant === 'primary' && { backgroundColor: theme.primary, shadowColor: theme.primary },
        variant === 'secondary' && { backgroundColor: theme.subtleBoxBg, borderColor: theme.border, borderWidth: 1 },
        variant === 'outline' && { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1.5 },
        variant === 'danger' && styles.danger,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {IconComponent && (
            <View style={styles.iconMargin}>
              <IconComponent size={18} color={iconColor} />
            </View>
          )}
          <Text
            style={[
              styles.text,
              variant === 'primary' && styles.primaryText,
              variant === 'secondary' && { color: theme.textPrimary },
              variant === 'outline' && { color: theme.textPrimary },
              variant === 'danger' && styles.dangerText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 8,
  },
  danger: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  primaryText: {
    color: '#ffffff',
  },
  dangerText: {
    color: '#ffffff',
  },
});
