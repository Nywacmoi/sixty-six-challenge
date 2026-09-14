import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, ThemeColors, Typography } from '../theme/theme';
import { AVATAR_MILESTONES } from '../data/avatarItems';
import { RingProgress } from './RingProgress';

// Frames the avatar in a level-style progress ring and adds a "Jour 1 →
// Jour 99" milestone strip with a short caption per tier — the pacing and
// tone come straight from a reference the user shared for how the app's
// avatar evolution should feel. The portrait itself is unchanged (still the
// wardrobe-driven DiceBear illustration); this is what makes its day-by-day
// progression legible the way the reference frames it.
export function AvatarProgress({
  currentDay,
  totalDays,
  children,
}: {
  currentDay: number;
  totalDays: number;
  children: React.ReactNode;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  const passed = [...AVATAR_MILESTONES].reverse().find((m) => currentDay >= m.day) ?? AVATAR_MILESTONES[0];
  const ringColor = currentDay >= 99 ? colors.gold : colors.accent;

  return (
    <View style={{ alignItems: 'center' }}>
      <RingProgress progress={totalDays > 0 ? currentDay / totalDays : 0} size={148} strokeWidth={6} color={ringColor}>
        {children}
      </RingProgress>

      <Text style={[typography.caption, { marginTop: spacing.sm }]}>
        JOUR {currentDay} SUR {totalDays}
      </Text>
      <Text style={[typography.bodyBold, { marginTop: 2, textAlign: 'center' }]}>{passed.caption}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineRow}
        style={styles.timelineScroll}
      >
        {AVATAR_MILESTONES.map((m, i) => {
          const done = currentDay >= m.day;
          const isCurrent = m.day === passed.day;
          return (
            <React.Fragment key={m.day}>
              {i > 0 && <View style={[styles.connector, done && { backgroundColor: colors.accent }]} />}
              <View
                style={[
                  styles.dot,
                  done && { backgroundColor: colors.accent, borderColor: colors.accent },
                  isCurrent && { backgroundColor: colors.background, borderColor: colors.accent, borderWidth: 2 },
                ]}
              >
                {done && !isCurrent ? (
                  <Ionicons name="checkmark" size={12} color={colors.background} />
                ) : (
                  <Text style={[typography.small, { color: isCurrent ? colors.accent : colors.textTertiary }]}>{m.day}</Text>
                )}
              </View>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    timelineScroll: { marginTop: spacing.lg, alignSelf: 'stretch' },
    timelineRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: 2 },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    connector: { width: 16, height: 2, backgroundColor: colors.border },
  });
}
