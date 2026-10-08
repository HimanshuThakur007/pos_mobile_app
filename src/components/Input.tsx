import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Pressable, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
  label,
  error,
  icon: IconComponent,
  rightElement,
  style,
  onFocus,
  onBlur,
  placeholderTextColor,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const fallbackRef = useRef<TextInput>(null);
  const inputRef = (ref as React.RefObject<TextInput>) || fallbackRef;
  const { theme } = useTheme();

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: theme.textPrimary }]} onPress={handleContainerPress}>
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBg,
            borderColor: isFocused ? theme.primary : error ? '#ef4444' : theme.inputBorder,
          },
          isFocused && {
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 2,
          },
        ]}
      >
        {IconComponent && (
          <View style={styles.iconBox} pointerEvents="none">
            <IconComponent size={18} color={isFocused ? theme.primary : theme.textMuted} />
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: theme.textPrimary },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
            style,
          ]}
          placeholderTextColor={placeholderTextColor || theme.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          {...props}
        />
        {rightElement}
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  iconBox: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '600',
  },
});
