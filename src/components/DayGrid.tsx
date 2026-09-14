import React, { useState } from 'react';
import { View, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
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
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  // Measured rather than computed from percentages: percentage widths and gaps
  // disagree just enough across native and web to leave a ragged right edge on
  // a grid this dense.
  const cell = width > 0 ? (width - gap * (columns - 1)) / columns : 0;

  const total = values.length || TOTAL_DAYS;

  return (
    <View onLayout={onLayout} style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}>
      {cell > 0 &&
        values.map((value, index) => {
          const day = index + 1;
          const base = { width: cell, height: cell, borderRadius: radius };

          if (day > currentDay) {
            return <View key={index} style={[base, { backgroundColor: emptyColor ?? colors.surfaceElevated }]} />;
          }
          if (value <= 0) {
            // Clearly lighter than an untouched future day, because the two
            // mean opposite things: one is a day that came and went empty, the
            // other hasn't happened yet. Still muted — a gap in the fabric,
            // not an accusation.
            return <View key={index} style={[base, { backgroundColor: missedColor ?? colors.textTertiary + '70' }]} />;
          }

          const color = tint ?? progressColor(index / Math.max(total - 1, 1));
          const isToday = day === currentDay;
          return (
            <View
              key={index}
              style={[
                base,
                { backgroundColor: color, opacity: 0.4 + value * 0.6 },
                isToday && { borderWidth: 1.5, borderColor: todayBorderColor ?? colors.text, opacity: 1 },
              ]}
            />
          );
        })}
    </View>
  );
}
