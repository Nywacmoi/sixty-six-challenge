import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { ACHIEVEMENTS } from '../data/achievements';
import { AVATAR_ITEMS } from '../data/avatarItems';

// Every avatar item unlocks on the exact day of an existing day-N
// achievement, so a single toast can flex both rewards at once instead of
// needing a second, separate "new outfit" notification.
function findUnlockedOutfit(achievementId: string) {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement || achievement.kind !== 'dayReached') return null;
  return AVATAR_ITEMS.find((item) => item.unlockDay === achievement.target) ?? null;
}

export function AchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: { id: string; title: string; icon: string };
  onDismiss: () => void;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const translateY = useRef(new Animated.Value(-100)).current;
  const outfit = findUnlockedOutfit(achievement.id);

  useEffect(() => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }).start(onDismiss);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toast, { top: topInset + spacing.sm, transform: [{ translateY }] }]}>
      <Pressable style={styles.inner} onPress={onDismiss}>
        <Ionicons name={achievement.icon as any} size={22} color={colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyBold} numberOfLines={1}>
            Succès débloqué : {achievement.title}
          </Text>
          {outfit && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={typography.caption} numberOfLines={1}>
                + tenue débloquée :
              </Text>
              <Ionicons name={outfit.icon as any} size={13} color={colors.textSecondary} />
              <Text style={typography.caption} numberOfLines={1}>
                {outfit.name}
              </Text>
            </View>
          )}
        </View>
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
