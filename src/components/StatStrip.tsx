import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, ThemeColors } from '../theme/theme';

export type StatStripItem = { value: string | number; label: string };

// Three or four numbers side by side, fenced by hairlines instead of sitting
// in their own little grey boxes. The boxes were the problem: three rounded
// cards in a row turn three facts into three objects competing for attention,
// where this reads as one instrument panel and lets the numbers themselves
// carry the weight.
export function StatStrip({ items, style }: { items: StatStripItem[]; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.strip, style]}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.cell, index > 0 && styles.cellDivided]}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    strip: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.md - 3,
    },
    cell: { flex: 1, alignItems: 'center' },
    cellDivided: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
    value: { fontFamily: fonts.bold, fontSize: 19, color: colors.text },
    label: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.1, color: colors.textTertiary, marginTop: 3 },
  });
}
