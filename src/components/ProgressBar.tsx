import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/theme';
import { ThemeColors } from '../theme/theme';

export function ProgressBar({ progress, height = 10 }: { progress: number; height?: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${pct * 100}%`, height }]} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    track: {
      width: '100%',
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    fill: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
    },
  });
}
