import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { FreeResource } from '../data/freeCourses';

export function ResourceLinks({ title, resources }: { title: string; resources: FreeResource[] }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  return (
    <View>
      <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>{title}</Text>
      <View style={{ gap: spacing.sm }}>
        {resources.map((r) => (
          <Pressable key={r.name} style={styles.row} onPress={() => Linking.openURL(r.url)}>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{r.name}</Text>
              <Text style={typography.caption}>{r.description}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.accent} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
  });
}
