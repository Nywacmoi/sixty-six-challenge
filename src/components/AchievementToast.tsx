import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';

export function AchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: { title: string; icon: string };
  onDismiss: () => void;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }).start(onDismiss);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }] }]}>
      <Pressable style={styles.inner} onPress={onDismiss}>
        <Ionicons name={achievement.icon as any} size={22} color={colors.gold} />
        <Text style={typography.bodyBold} numberOfLines={1}>
          Succès débloqué : {achievement.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    toast: {
      position: 'absolute',
      top: 0,
      left: spacing.lg,
      right: spacing.lg,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.gold + '55',
    },
  });
}
