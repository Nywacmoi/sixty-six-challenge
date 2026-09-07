import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { ACHIEVEMENTS } from '../data/achievements';
import { useTopInset } from '../hooks/useTopInset';
import { useTabBarClearance } from '../hooks/useTabBarClearance';

export default function AchievementsScreen() {
  const { unlockedAchievements } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const tabBarClearance = useTabBarClearance();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: topInset + spacing.sm }}>
        <Text style={typography.display}>Succès</Text>
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          {unlockedAchievements.length} sur {ACHIEVEMENTS.length} débloqués
        </Text>
      </View>
      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={(a) => a.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + tabBarClearance }}
        columnWrapperStyle={{ gap: spacing.md }}
        renderItem={({ item }) => {
          const unlocked = unlockedAchievements.includes(item.id);
          return (
            <View style={[styles.card, !unlocked && styles.cardLocked]}>
              <View style={[styles.badge, unlocked && styles.badgeUnlocked]}>
                <Ionicons name={item.icon as any} size={26} color={unlocked ? colors.gold : colors.textTertiary} />
              </View>
              <Text style={[typography.bodyBold, { textAlign: 'center', marginTop: spacing.sm }]}>{item.title}</Text>
              <Text style={[typography.small, { textAlign: 'center', marginTop: 4 }]}>{item.description}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    cardLocked: { opacity: 0.55 },
    badge: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeUnlocked: {
      backgroundColor: colors.gold + '22',
      borderWidth: 1,
      borderColor: colors.gold + '55',
    },
  });
}
