import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, TOTAL_DAYS, ThemeColors } from '../theme/theme';
import { DayGrid } from './DayGrid';
import { AmbientBackdrop } from './AmbientBackdrop';
import { useDayValues } from '../hooks/useDayValues';
import { progressColor } from '../utils/progressColor';

// The old version held a logo, a tagline and a progress bar for two and a half
// seconds. The bar was the problem: nothing was loading behind it — fonts and
// storage are ready in a fraction of that — so it animated a duration decided
// in advance while the person waited. A fake gauge on an app you open several
// times a day, every day for ninety-nine days.
//
// The grid takes its place and doesn't lie: it sweeps in showing the person's
// actual challenge, so the hold is spent on information instead of decoration.
// It also means this screen isn't the same for everyone — day 3 is blue and
// nearly empty, day 90 is green and dense. Your app stops looking like mine.
//
// The variant is decided straight from the loaded state rather than latched
// behind a timer. The store resolves in a few dozen milliseconds, well inside
// the mark's own fade-in, so nobody sees the switch — and the earlier timer
// bought nothing while forcing the layout to change shape at 340ms.
const BODY_DELAY_MS = 260;
// The grid's own wave takes about this long, and the counter is tuned to land
// on the real number just before the last filled cell settles — so the figure
// stops climbing at the moment the block finishes.
const SEQUENCE_MS = 900;
const COUNT_LANDS_AT = 0.72;
// Below this a run is an attempt; past it, it's worth putting at stake.
const STREAK_WORTH_NAMING = 3;
// From the very first day, as soon as there's at least one habit to track.
// An empty grid was the argument for holding it back, but that argument cut
// the wrong way: day 1 is precisely when seeing ninety-nine empty days ahead
// means something. Someone with no habits at all still gets the tagline —
// a grid of nothing measures nothing.
const MIN_DAY_FOR_GRID = 1;
const MARK_W = 104;
const MARK_H = MARK_W * (428 / 1107);
// The lift is the first thing that moves, and the body starts arriving
// before it lands, so the mark seems to make room rather than move away.
const LIFT_MS = 560;

export function LaunchScreen({
  duration = 1400,
  frozen = false,
}: {
  duration?: number;
  /** Rendered as the dissolving cover over the app: same screen, already in
   *  its finished state, so nothing replays on the way out. */
  frozen?: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { loading, currentDay, challengeFinished, challengeNumber, habits, todayProgress, getStreak } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const dayValues = useDayValues();

  const activeHabits = habits.filter((h) => !h.archived);
  const day = Math.max(currentDay, activeHabits.length > 0 ? 1 : 0);
  const streak = activeHabits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0);
  const dayDone = todayProgress >= 1;

  // One value drives the whole opening: the grid laying itself down, the
  // number climbing to meet it, and the colour blooming behind both. Three
  // separate animations that merely overlap read as three animations; one
  // timeline with several instruments reads as a single movement.
  const sequence = useRef(new Animated.Value(frozen ? 1 : 0)).current;
  const [counted, setCounted] = useState(frozen ? 1 : 0);

  // The mark doesn't fade in any more: it's already on screen. The iOS
  // startup image and then the HTML splash (public/index.html) both show it
  // dead centre from the tap on the icon, so this screen's first frame draws
  // it in exactly that spot — centred by layout, not by numbers that only
  // arrive after the first paint — and then lifts it into its place in the
  // column while the day unfolds under it. One logo from icon to app,
  // instead of a white flash, an empty screen and a logo fading in.
  const lift = useRef(new Animated.Value(0)).current;
  const [boxHeight, setBoxHeight] = useState<number | null>(null);
  // The slot's position is only meaningful for the layout that produced it.
  // Measured first under the tagline layout (store still loading, logo
  // almost centred), then the grid arrives and the slot jumps up the screen:
  // a lift aimed at the first reading stopped 24pt short of a target 265pt
  // away. So each reading records which layout it belongs to.
  const [slot, setSlot] = useState<{ y: number; personal: boolean } | null>(null);
  const bodyOpacity = useRef(new Animated.Value(frozen ? 1 : 0)).current;
  const bodyTranslate = useRef(new Animated.Value(frozen ? 0 : 10)).current;

  const personal = !loading && day >= MIN_DAY_FOR_GRID;
  const remaining = Math.round((1 - todayProgress) * activeHabits.length);

  useEffect(() => {
    const id = sequence.addListener(({ value }) => setCounted(value));
    return () => sequence.removeListener(id);
  }, [sequence]);

  // Everything waits for the store and for both measurements. Before the
  // store answers, the column is the tagline variant; lifting the mark
  // toward that layout and then re-aiming when the grid appears would be a
  // visible correction. The store answers in tens of milliseconds, while the
  // mark simply holds the splash's position.
  const started = useRef(false);
  const slotFits = slot != null && slot.personal === personal;
  useEffect(() => {
    if (frozen || boxHeight == null || !slotFits || loading) return;
    const target = slot!.y - (boxHeight - MARK_H) / 2;

    // Already under way and the column moved again (a line rewrapping once
    // the font arrives): re-aim from wherever the mark is, briefly, instead
    // of landing a few points off its place.
    if (started.current) {
      Animated.timing(lift, { toValue: target, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      return;
    }
    started.current = true;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.timing(lift, {
      toValue: target,
      duration: LIFT_MS,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();

    Animated.timing(sequence, {
      toValue: 1,
      duration: SEQUENCE_MS,
      delay: BODY_DELAY_MS,
      easing: Easing.out(Easing.cubic),
      // The grid reads this value through interpolations on transform and
      // opacity, which the native driver can carry; the counter reads it
      // through a listener, which it cannot. The listener wins.
      useNativeDriver: false,
    }).start();

    Animated.parallel([
      Animated.timing(bodyOpacity, {
        toValue: 1,
        duration: 380,
        delay: BODY_DELAY_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(bodyTranslate, {
        toValue: 0,
        duration: 380,
        delay: BODY_DELAY_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [frozen, loading, boxHeight, slot, slotFits, lift, sequence, bodyOpacity, bodyTranslate]);

  const accent = personal ? progressColor(Math.min(day / TOTAL_DAYS, 1)) : colors.accent;

  return (
    <View style={styles.container} onLayout={(e) => setBoxHeight(e.nativeEvent.layout.height)}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { opacity: sequence.interpolate({ inputRange: [0, 0.5], outputRange: [0, 1], extrapolate: 'clamp' }) },
        ]}
      >
        <AmbientBackdrop color={accent} />
      </Animated.View>

      {/* The column is measured, not the mark's slot inside it: on web,
          onLayout is a ResizeObserver, which reports size changes and never
          position changes. The slot keeps its size while the column
          re-centres around it, so it was never re-measured; the column's own
          height changes exactly when the slot moves (the grid arriving, a
          line rewrapping when the font loads), and its top edge is the slot. */}
      <View style={styles.column} onLayout={(e) => setSlot({ y: e.nativeEvent.layout.y, personal })}>
        {/* The mark's place in the column. Live, it's an empty slot the lifted
          mark lands on; frozen (the copy dissolving over the app), the mark
          is simply drawn in it — the same pixels the live one ended on. */}
        {frozen ? <Mark color={colors.text} /> : <View style={styles.mark} />}

        <Animated.View style={[styles.body, { opacity: bodyOpacity, transform: [{ translateY: bodyTranslate }] }]}>
          {personal ? (
            <>
              {/* Past day 99 the count still lands on 99 over a full green grid —
                the finished challenge replayed in a second — but it's named as
                an ending rather than as a day that never ends. */}
              <Text style={styles.kicker}>
                {challengeFinished ? 'DÉFI TERMINÉ' : challengeNumber > 1 ? `DÉFI ${challengeNumber} · JOUR` : 'JOUR'}
              </Text>
              <Text style={styles.day}>{Math.round(Math.min(counted / COUNT_LANDS_AT, 1) * day)}</Text>
              {/* What's at stake, stated as a fact rather than a nudge. The run
                you've built, and the hole still open in today — the gap between
                the two is the whole reason to stay in the app. */}
              {streak >= STREAK_WORTH_NAMING && !dayDone ? (
                <Text style={styles.stake}>{streak} jours d’affilée · aujourd’hui n’est pas encore fait</Text>
              ) : dayDone ? (
                <Text style={styles.stake}>journée validée</Text>
              ) : remaining > 0 ? (
                // Was empty: below a three-day run the screen ended on the
                // number. What's left today is true for everyone, every morning.
                <Text style={styles.stake}>
                  {remaining} habitude{remaining > 1 ? 's t’attendent' : ' t’attend'} aujourd’hui
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.tagline}>99 jours pour construire ta discipline</Text>
          )}
        </Animated.View>

        {personal && (
          <View style={styles.gridWrap}>
            <DayGrid
              values={dayValues}
              currentDay={day}
              width={screenWidth - spacing.lg * 2}
              animate={!frozen}
              progress={frozen ? undefined : sequence}
            />
          </View>
        )}
      </View>

      {!frozen && (
        <View style={styles.markLayer} pointerEvents="none">
          <Animated.View style={{ transform: [{ translateY: lift }] }}>
            <Mark color={colors.text} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// Rendered off-white rather than in the brand blue: the rest of the screen
// shifts from blue to green with how far along you are, and a fixed electric
// blue mark fought that badly at the green end. Same size and colour as the
// HTML splash and the iOS startup images — change one, change all three.
function Mark({ color }: { color: string }) {
  return (
    <Image source={require('../../assets/logo.png')} style={{ width: MARK_W, height: MARK_H }} resizeMode="contain" tintColor={color} />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Centred as one column, both variants. The previous version anchored the
    // mark near the top and let an auto margin push the grid to the bottom,
    // which only held together when there was a grid: on day 1 the tagline
    // variant left the logo stranded under the status bar above an empty
    // screen. And the top anchor was `marginTop: '18%'`, which resolves
    // against the parent's WIDTH, not its height — so it was never the 18% of
    // the screen it looked like.
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    // The slot, the day and the grid as one block, centred by the container
    // exactly as they were when they were its direct children.
    column: { alignSelf: 'stretch', alignItems: 'center' },
    // Mark-only logo (no wordmark baked in).
    mark: { width: MARK_W, height: MARK_H },
    // Over the whole screen, centring its one child: the splash's position,
    // reached through layout so it's right on the very first frame.
    markLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
    body: { alignItems: 'center', marginTop: spacing.xl },
    kicker: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 3, color: colors.textTertiary },
    day: {
      fontFamily: fonts.display,
      fontSize: 112,
      lineHeight: 116,
      letterSpacing: -7,
      color: colors.text,
      marginTop: 6,
    },
    tagline: { fontFamily: fonts.semiBold, fontSize: 13, letterSpacing: 0.3, color: colors.textSecondary },
    stake: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: spacing.sm + 2,
      textAlign: 'center',
    },
    gridWrap: { alignSelf: 'stretch', marginTop: spacing.xxl },
  });
}
