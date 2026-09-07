import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';

export function DayStats({
  bestStreak,
  currentStreak,
  streakFreezes,
}: {
  bestStreak: number;
  currentStreak: number;
  streakFreezes: number;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={typography.caption}>MEILLEURE SÉRIE</Text>
        <Text style={typography.h1}>{bestStreak}j</Text>
      </View>
      <View style={styles.card}>
        <Text style={typography.caption}>SÉRIE ACTUELLE</Text>
        <Text style={typography.h1}>{currentStreak}j</Text>
      </View>
      {streakFreezes > 0 && (
        <View style={styles.shieldCard}>
          <Ionicons name="shield-checkmark" size={20} color={colors.gold} />
          <Text style={styles.shieldCount}>{streakFreezes}</Text>
        </View>
      )}
    </View>
  );
}

export function ShareDayCta({ day, onPress }: { day: number; onPress: () => void }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  return (
    <Pressable style={styles.shareCta} onPress={onPress}>
      <Text style={[typography.bodyBold, { color: colors.accent }]}>
        Jour {day} terminé. Partager
      </Text>
      <Ionicons name="arrow-forward" size={16} color={colors.accent} />
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    shieldCard: {
      width: 56,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    shieldCount: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.text },
    shareCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
      marginTop: spacing.sm,
    },
  });
}
