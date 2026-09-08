import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { Habit } from '../types';
import { SwipeableRow } from './SwipeableRow';

export function HabitRow({
  habit,
  completed,
  streak,
  onToggle,
  onPress,
  onDelete,
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  onToggle: () => void;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  return (
    <SwipeableRow onDelete={onDelete}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
        <View style={[styles.iconWrap, { backgroundColor: habit.color + '26' }]}>
          <Ionicons name={habit.icon as any} size={20} color={habit.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyBold}>{habit.name}</Text>
          {streak > 0 ? (
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={13} color={colors.accent} />
              <Text style={styles.streakText}>{streak} jour{streak > 1 ? 's' : ''}</Text>
            </View>
          ) : (
            <Text style={styles.streakTextMuted}>Pas encore de série</Text>
          )}
        </View>
        <Pressable onPress={handleToggle} hitSlop={10} style={[styles.checkbox, completed && styles.checkboxDone]}>
          {completed && <Ionicons name="checkmark" size={18} color={colors.background} />}
        </Pressable>
      </Pressable>
    </SwipeableRow>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.md,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    streakText: { ...typography.small, color: colors.accent },
    streakTextMuted: { ...typography.small, marginTop: 3 },
    checkbox: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxDone: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
  });
}
