import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';

export function InsightBanner({ text }: { text: string }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  return (
    <View style={styles.banner}>
      <Ionicons name="flame" size={18} color={colors.success} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.success + '14',
      borderWidth: 1,
      borderColor: colors.success + '33',
      borderRadius: radius.md,
      padding: spacing.md,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
    },
    text: { ...typography.caption, color: colors.text, flex: 1, textTransform: 'none', letterSpacing: 0 },
  });
}
