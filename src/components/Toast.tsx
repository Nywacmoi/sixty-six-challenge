import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';

// Clears the tallest header this toast can appear under (TodayScreen's
// two-line "JOUR X SUR 99 / Aujourd'hui") so the toast never overlaps the
// screen title — see .claude/journal.md.
const HEADER_CLEARANCE = 80;

export function Toast({
  icon,
  message,
  accentColor,
  onDismiss,
}: {
  icon: string;
  message: string;
  accentColor?: string;
  onDismiss: () => void;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const translateY = useRef(new Animated.Value(-100)).current;
  const accent = accentColor ?? colors.success;

  useEffect(() => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }).start(onDismiss);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toast, { top: topInset + spacing.sm + HEADER_CLEARANCE, transform: [{ translateY }] }]}>
      <Pressable style={[styles.inner, { borderColor: accent + '55' }]} onPress={onDismiss}>
        <Ionicons name={icon as any} size={20} color={accent} />
        <Text style={typography.bodyBold} numberOfLines={2}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    toast: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      zIndex: 50,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
    },
  });
}
