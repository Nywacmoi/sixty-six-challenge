import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={[typography.bodyBold, variant === 'secondary' && { color: colors.text }, variant === 'primary' && { color: '#FFFFFF' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    base: {
      backgroundColor: colors.accent,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondary: {
      backgroundColor: colors.surfaceElevated,
    },
    disabled: {
      opacity: 0.4,
    },
  });
}
