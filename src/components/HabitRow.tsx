import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { Habit } from '../types';
import { SwipeableRow } from './SwipeableRow';
import { AppIcon } from './AppIcon';
import { XP_PER_COMPLETION } from '../utils/gamification';

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
  const [showXpFloat, setShowXpFloat] = useState(false);
  const xpAnim = useRef(new Animated.Value(0)).current;
  const tintAnim = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const checkScale = useRef(new Animated.Value(1)).current;

  // The row's colour fades in and the checkbox gives a little pop, so
  // ticking something registers as an event rather than an instant repaint.
  useEffect(() => {
    Animated.timing(tintAnim, {
      toValue: completed ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
    if (completed) {
      Animated.sequence([
        Animated.spring(checkScale, { toValue: 1.2, useNativeDriver: true, speed: 50, bounciness: 14 }),
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
      ]).start();
    }
  }, [completed, tintAnim, checkScale]);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!completed) {
      xpAnim.setValue(0);
      setShowXpFloat(true);
      Animated.timing(xpAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start(() => {
        setShowXpFloat(false);
      });
    }
    onToggle();
  };

  return (
    <SwipeableRow onDelete={onDelete}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
        {/* A ticked habit takes on its own colour instead of staying
            identical to an untouched one — checking something off should
            visibly change the list, not just fill a circle. The tint is a
            layer over the opaque row rather than a translucent background:
            SwipeableRow keeps a red "delete" panel permanently mounted
            behind every row, and a see-through background lets it bleed
            through. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.tint, { backgroundColor: habit.color + '1F', borderColor: habit.color + '55', opacity: tintAnim }]}
        />
        <View style={[styles.colorBar, { backgroundColor: habit.color }]} />
        <View style={[styles.iconWrap, { backgroundColor: habit.color + (completed ? '2E' : '26') }]}>
          <AppIcon name={habit.icon} size={20} color={habit.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyBold, completed && { color: colors.textSecondary }]}>{habit.name}</Text>
          {streak > 0 ? (
            <View style={styles.streakRow}>
              {/* The set's own flame, not Ionicons' filled one: a row whose
                  habit icon is already a flame would otherwise show two
                  different flames, six pixels apart. */}
              <AppIcon name="flame" size={14} color={completed ? habit.color : colors.accent} />
              <Text style={[styles.streakText, completed && { color: habit.color }]}>
                {streak} jour{streak > 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.streakTextMuted}>Pas encore de série</Text>
          )}
        </View>
        <View>
          {showXpFloat && (
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.xpFloat,
                {
                  color: colors.gold,
                  opacity: xpAnim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                  transform: [
                    { translateY: xpAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -34] }) },
                    { scale: xpAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.7, 1.08, 1] }) },
                  ],
                },
              ]}
            >
              +{XP_PER_COMPLETION} XP
            </Animated.Text>
          )}
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Pressable
              onPress={handleToggle}
              hitSlop={10}
              style={[styles.checkbox, completed && { backgroundColor: habit.color, borderColor: habit.color }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: completed }}
              accessibilityLabel={`${habit.name} — ${completed ? 'fait aujourd\'hui' : 'pas encore fait'}`}
            >
              {completed && <Ionicons name="checkmark" size={18} color={colors.background} />}
            </Pressable>
          </Animated.View>
        </View>
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
      // Deliberately a plain square: SwipeableRow owns the rounded corners
      // and the outline. See the note on its `container` style.
      padding: spacing.md,
      gap: spacing.md,
    },
    colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    tint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // One less than the container's radius: inside a 1px border the clip
      // curve tightens by exactly that much, so the tinted outline lands on
      // the visible edge instead of a pixel outside it.
      borderRadius: radius.md - 1,
      borderWidth: 1,
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
    xpFloat: {
      position: 'absolute',
      top: -6,
      left: -20,
      right: -20,
      textAlign: 'center',
      fontFamily: typography.small.fontFamily,
      fontSize: 12,
      fontWeight: 'bold',
      zIndex: 5,
    },
  });
}
