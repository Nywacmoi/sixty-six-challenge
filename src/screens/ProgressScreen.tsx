import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, TOTAL_DAYS, radius, ThemeColors, Typography } from '../theme/theme';
import { ProgressGlow } from '../components/ProgressGlow';
import { DayGrid } from '../components/DayGrid';
import { StatStrip } from '../components/StatStrip';
import { SectionLabel } from '../components/SectionLabel';
import { JourneyPath } from '../components/JourneyPath';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { progressColor } from '../utils/progressColor';

import { useDayValues } from '../hooks/useDayValues';
import { useTopInset } from '../hooks/useTopInset';
import { useTabBarClearance } from '../hooks/useTabBarClearance';

const GLOW_SIZE = 340;

export default function ProgressScreen({ navigation }: any) {
  const { habits, currentDay, getStreak, getLongestStreak, getTotalCompletions, profile } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const activeHabits = habits.filter((h) => !h.archived);
  // Same clamp as TodayScreen's header: the day counter starts at 0 until the
  // challenge's first midnight, but once you have habits you're on day 1 as
  // far as the app is concerned. Without this the two screens disagreed —
  // Aujourd'hui said "JOUR 1", this one said "0".
  const day = Math.max(currentDay, activeHabits.length ? 1 : 0);
  const overallProgress = Math.min(day / TOTAL_DAYS, 1);
  const topInset = useTopInset();
  const tabBarClearance = useTabBarClearance();

  // The maximum number of check-ins that could exist so far, if every active
  // habit had been checked every day since the challenge started — the same
  // approximation WeeklyRecapScreen uses for its own (7-day) rate, just over
  // the whole challenge instead of one week. Gives an honest "how am I
  // doing" number, which nothing on this screen showed before.
  const maxPossibleCompletions = activeHabits.length * Math.max(currentDay, 1);
  const completionRate = maxPossibleCompletions > 0 ? getTotalCompletions() / maxPossibleCompletions : 0;

  const dayValues = useDayValues();

  // Same single animated value behind the number and the colour as
  // on Aujourd'hui, so the two screens move the same way. 99 days is a slow
  // number to watch tick up, so this one runs a touch longer.
  const anim = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setDisplayed(value));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: overallProgress,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [overallProgress, anim]);

  const color = progressColor(displayed);
  const daysLeft = Math.max(TOTAL_DAYS - day, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl + tabBarClearance }}>
        <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
          <Text style={typography.caption}>DEPUIS LE DÉBUT</Text>
          <Text style={typography.display}>Progression</Text>
        </View>

        {/* No ring here any more. It and the grid below said the same thing,
            and the grid says it better: it shows not just how far along you
            are but how you got there. What's left is the number itself, at a
            size that can carry the screen on its own. */}
        <View style={styles.hero}>
          <ProgressGlow color={color} size={GLOW_SIZE} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.day}>{Math.round(displayed * TOTAL_DAYS)}</Text>
            <Text style={styles.daySub}>
              sur {TOTAL_DAYS} jours
              {daysLeft > 0 ? ` · il reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''}` : ' · défi terminé'}
            </Text>
            <Text style={[styles.status, { color }]}>{Math.round(displayed * 100)}% DU DÉFI</Text>
          </View>
        </View>

        <SectionLabel style={styles.sectionLabel}>TON PARCOURS</SectionLabel>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <DayGrid values={dayValues} currentDay={day} />
        </View>

        <StatStrip
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}
          items={[
            { value: `${Math.round(completionRate * 100)}%`, label: 'RÉUSSITE' },
            { value: getTotalCompletions(), label: 'CHECK-INS' },
            { value: activeHabits.length, label: 'HABITUDES' },
          ]}
        />

        <Pressable style={styles.recapRow} onPress={() => navigation.navigate('WeeklyRecap')}>
          <Ionicons name="sparkles-outline" size={17} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>Ton récap de la semaine</Text>
            <Text style={styles.recapSub} numberOfLines={1}>
              Check-ins, jours parfaits, top habitude
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
        </Pressable>

        <SectionLabel style={styles.sectionLabel}>TES JALONS</SectionLabel>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <JourneyPath
            currentDay={day}
            avatar={
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
                size={56}
              />
            }
          />
        </View>

        <SectionLabel style={styles.sectionLabel}>PAR HABITUDE</SectionLabel>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {activeHabits.length === 0 && (
            <Text style={typography.caption}>Ajoute une habitude pour voir sa progression ici.</Text>
          )}
          {activeHabits.map((h) => {
            const streak = getStreak(h.id);
            const record = getLongestStreak(h.id);
            // How close today's run is to this habit's own best. A bar that
            // fills as you approach your record says more than the two
            // numbers alone, and it's the record — not some arbitrary target
            // — that makes the comparison fair.
            const towardRecord = record > 0 ? Math.min(streak / record, 1) : 0;
            return (
              <View key={h.id} style={styles.habitRow}>
                <View style={[styles.colorBar, { backgroundColor: h.color }]} />
                <View style={styles.habitTop}>
                  <View style={[styles.iconWrap, { backgroundColor: h.color + '26' }]}>
                    <Ionicons name={h.icon as any} size={18} color={h.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{h.name}</Text>
                    <Text style={styles.habitSub}>
                      {record > 0 ? `record ${record} jour${record > 1 ? 's' : ''}` : 'pas encore de record'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.streakValue, { color: streak > 0 ? h.color : colors.textTertiary }]}>{streak}</Text>
                    <Text style={styles.streakLabel}>SÉRIE</Text>
                  </View>
                </View>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${Math.round(towardRecord * 100)}%`, backgroundColor: h.color }]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg },
    hero: { alignItems: 'center', justifyContent: 'center', height: 190, marginTop: spacing.sm },
    day: { fontFamily: fonts.display, fontSize: 104, color: colors.text, letterSpacing: -5.5, lineHeight: 106 },
    daySub: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginTop: 10 },
    status: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1.4, marginTop: 3 },
    countLine: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    countValue: { fontFamily: fonts.bold, color: colors.textSecondary },
    recapRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      paddingVertical: spacing.md - 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    recapSub: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
    sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm + 2, marginHorizontal: spacing.lg },
    habitRow: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      overflow: 'hidden',
    },
    colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    habitTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    habitSub: { ...typography.small, color: colors.textTertiary, marginTop: 3 },
    streakValue: { fontFamily: fonts.bold, fontSize: 19 },
    streakLabel: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.1, color: colors.textTertiary, marginTop: 1 },
    track: {
      height: 3,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.pill,
      marginTop: spacing.md - 4,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: radius.pill },
  });
}
