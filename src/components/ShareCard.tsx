import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AvatarDisplay } from './AvatarDisplay';
import { DayGrid } from './DayGrid';
import { ProgressGlow } from './ProgressGlow';
import { Profile } from '../types';
import { fonts, spacing, radius, TOTAL_DAYS } from '../theme/theme';
import { progressColor } from '../utils/progressColor';

export const CARD_WIDTH = 320;
export const CARD_HEIGHT = 530;

// Deliberately not themed. This is the only thing anyone else ever sees of the
// app, so it looks the same whoever exports it — a black poster with one
// accent, rather than a screenshot that happens to be white for half the
// users. These are the dark palette's own values, hardcoded for that reason.
const INK = '#000000';
const TEXT = '#F5F5F0';
const FAINT = '#5C5C60';
const EMPTY_CELL = '#16161A';
const MISSED_CELL = '#34343C';

// Built for export via react-native-view-shot rather than being a screenshot of
// the recap screen: a denser, self-contained layout that has to read at a
// glance in someone else's feed. The 99-day grid carries it — it's the app's
// most recognisable shape, and it says more about the person's run than any
// number could.
export const ShareCard = forwardRef<
  View,
  {
    profile: Profile;
    currentDay: number;
    dayValues: number[];
    checkIns: number;
    perfectDays: number;
    bestStreak: number;
  }
>(({ profile, currentDay, dayValues, checkIns, perfectDays, bestStreak }, ref) => {
  const day = Math.max(currentDay, 1);
  const accent = progressColor(Math.min(day / TOTAL_DAYS, 1));

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <ProgressGlow color={accent} size={CARD_WIDTH * 1.5} style={styles.glow} />

      <Text style={styles.wordmark}>DÉFI 99</Text>

      <Text style={styles.day}>{day}</Text>
      <Text style={[styles.dayLabel, { color: accent }]}>SUR {TOTAL_DAYS} JOURS</Text>

      <DayGrid
        values={dayValues}
        currentDay={day}
        animate={false}
        gap={4}
        radius={3}
        style={styles.grid}
        emptyColor={EMPTY_CELL}
        missedColor={MISSED_CELL}
        todayBorderColor={TEXT}
      />

      <View style={styles.footer}>
        <View style={styles.stats}>
          <Stat value={bestStreak} label="SÉRIE" />
          <Stat value={checkIns} label="CHECK-INS" />
          <Stat value={perfectDays} label="PARFAITS" />
        </View>
        <View style={[styles.avatar, { borderColor: accent + '80', backgroundColor: accent + '1A' }]}>
          <AvatarDisplay
            color={profile.avatarColor}
            seed={profile.avatarSeed}
            gender={profile.avatarGender}
            hair={profile.avatarHair}
            accessory={profile.avatarAccessory}
            facialHair={profile.avatarFacialHair}
            expression={profile.avatarExpression}
            hasAura={day >= 75}
            hasStar={day >= 99}
            size={38}
          />
        </View>
      </View>

      <View style={styles.rule} />
      <Text style={styles.tagline}>99 jours pour construire ta discipline</Text>
    </View>
  );
});

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: INK,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 4,
    paddingBottom: spacing.lg,
  },
  glow: { top: -CARD_WIDTH * 0.55, left: -CARD_WIDTH * 0.25 },
  wordmark: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 3.4, color: FAINT },
  day: {
    fontFamily: fonts.display,
    fontSize: 104,
    lineHeight: 108,
    letterSpacing: -6,
    color: TEXT,
    marginTop: spacing.sm + 2,
  },
  dayLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 2.6, marginTop: 6 },
  grid: { marginTop: spacing.lg + 4 },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  stats: { flexDirection: 'row', gap: spacing.lg },
  statValue: { fontFamily: fonts.bold, fontSize: 17, color: TEXT },
  statLabel: { fontFamily: fonts.bold, fontSize: 8, letterSpacing: 1.3, color: FAINT, marginTop: 2 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: '#26262C', marginTop: spacing.md },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 0.3,
    color: FAINT,
    marginTop: spacing.sm + 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
