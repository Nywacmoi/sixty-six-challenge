import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { TOTAL_DAYS } from '../theme/theme';
import { progressColor } from '../utils/progressColor';

// The 99 days of the challenge, laid out as one block. This is the app's most
// distinctive shape — it is literally its name made visible — so it earns the
// same treatment everywhere it appears rather than being a different table on
// each screen: whole challenge on Progression, a single habit's history on its
// own screen, and the share card.
//
// Two things are encoded at once. A cell's opacity is how much of that day you
// actually did, and its colour is where that day sits in the challenge, walking
// the same blue-to-green sweep as the ring. So the block shows where you are
// and how you got there in the same glance — which is what made the separate
// progress ring on Progression redundant.
//
// A habit's own screen passes `tint` instead: there the interesting variable is
// the habit, not the calendar, so the whole grid takes that habit's colour.
const DEFAULT_COLUMNS = 11;
const DEFAULT_GAP = 5;

// The cells arrive as a wave rather than all at once — ninety-nine squares
// appearing simultaneously is a wall, the same squares sweeping in read as the
// challenge being laid out day by day. One driving value feeds all of them,
// each cell reading a different slice of it, because ninety-nine separate
// animated values would be ninety-nine JS-driven timers on web.
const WAVE_MS = 820;
const WAVE_SPREAD = 0.55; // share of the timeline spent starting cells
const WAVE_CELL = 0.45; // how long each individual cell takes, as a share

export function DayGrid({
  values,
  currentDay,
  tint,
  columns = DEFAULT_COLUMNS,
  gap = DEFAULT_GAP,
  radius = 4,
  style,
  emptyColor,
  missedColor,
  todayBorderColor,
  animate = true,
  progress,
  width: fixedWidth,
}: {
  /** How much of each day was completed, 0 to 1. Index 0 is day 1. */
  values: number[];
  /** 1-based. Days past this are drawn as empty track. */
  currentDay: number;
  /** Overrides the blue-to-green sweep with a single colour. */
  tint?: string;
  columns?: number;
  gap?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** For surfaces that don't follow the app theme — the share card is always
   *  dark artwork, whichever theme the person is using. */
  emptyColor?: string;
  missedColor?: string;
  todayBorderColor?: string;
  /** Off for the share card: react-native-view-shot would otherwise capture
   *  the grid mid-wave and export a half-drawn image. */
  animate?: boolean;
  /** Drives the wave from outside instead of running its own. The launch
   *  screen passes the value that also drives its counter and its glow, so the
   *  three read as one movement rather than three animations that happen to
   *  overlap. */
  progress?: Animated.Value;
  /** Skips measurement when the caller already knows the width. Measuring is
   *  fine inside a scroll view, but a grid whose own height comes from its
   *  cells can't be measured in a container that has no other height: the box
   *  starts zero-high, onLayout never reports a usable width, so no cells are
   *  built, so the box stays zero-high. Passing the width breaks that loop. */
  width?: number;
}) {
  const { colors } = useTheme();
  const [measured, setMeasured] = useState(0);
  const width = fixedWidth ?? measured;
  const own = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const wave = progress ?? own;
  const hasPlayed = useRef(!animate || progress != null);

  const onLayout = (e: LayoutChangeEvent) => setMeasured(e.nativeEvent.layout.width);
  // Measured rather than computed from percentages: percentage widths and gaps
  // disagree just enough across native and web to leave a ragged right edge on
  // a grid this dense.
  const cell = width > 0 ? (width - gap * (columns - 1)) / columns : 0;

  const running = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => () => running.current?.stop(), []);

  // Started on first measurement, not on mount — before the container has a
  // width nothing is on screen to sweep, so the wave would play to an empty box.
  //
  // Note what this effect deliberately does NOT do: stop the animation on
  // cleanup. onLayout fires more than once (fonts settling, a resize, the
  // scroll view measuring again), and tearing the animation down on every
  // width change killed the wave at zero while `hasPlayed` blocked the restart
  // — leaving all ninety-nine cells permanently invisible. Only unmount stops it.
  useEffect(() => {
    if (width <= 0 || hasPlayed.current) return;
    hasPlayed.current = true;
    running.current = Animated.timing(own, {
      toValue: 1,
      duration: WAVE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    running.current.start();
  }, [width, own]);

  const total = values.length || TOTAL_DAYS;

  return (
    <View
      onLayout={fixedWidth == null ? onLayout : undefined}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, fixedWidth != null && { width: fixedWidth }, style]}
    >
      {cell > 0 &&
        values.map((value, index) => {
          const day = index + 1;
          const base = { width: cell, height: cell, borderRadius: radius };

          let background: string;
          let targetOpacity = 1;
          let extra: ViewStyle | undefined;

          if (day > currentDay) {
            background = emptyColor ?? colors.surfaceElevated;
          } else if (day === currentDay) {
            // Today is checked before the empty case on purpose. Falling into
            // the "missed" branch first meant that every morning, before
            // anything was ticked, the current day rendered as a grey hole —
            // marked as failed while it was still being lived. It now always
            // carries its own colour and outline, faint at zero and filling as
            // the day goes.
            background = tint ?? progressColor(index / Math.max(total - 1, 1));
            targetOpacity = 0.25 + value * 0.75;
            extra = { borderWidth: 1.5, borderColor: todayBorderColor ?? colors.text };
          } else if (value <= 0) {
            // Clearly lighter than an untouched future day, because the two
            // mean opposite things: one is a day that came and went empty, the
            // other hasn't happened yet. Still muted — a gap in the fabric,
            // not an accusation.
            background = missedColor ?? colors.textTertiary + '70';
          } else {
            background = tint ?? progressColor(index / Math.max(total - 1, 1));
            targetOpacity = 0.4 + value * 0.6;
          }

          const start = (index / Math.max(total - 1, 1)) * WAVE_SPREAD;
          const opacity = wave.interpolate({
            inputRange: [start, Math.min(start + WAVE_CELL, 1)],
            outputRange: [0, targetOpacity],
            extrapolate: 'clamp',
          });
          const scale = wave.interpolate({
            inputRange: [start, Math.min(start + WAVE_CELL, 1)],
            outputRange: [0.55, 1],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[base, { backgroundColor: background }, extra, { opacity, transform: [{ scale }] }]}
            />
          );
        })}
    </View>
  );
}
