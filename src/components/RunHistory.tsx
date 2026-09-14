import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { RouteMap } from './RouteMap';
import { formatPace, formatDuration } from '../utils/geo';
import { formatDayLabel, todayKey, addDays } from '../utils/date';

const MAX_SHOWN = 5;

export function RunHistory({ habitId, color }: { habitId: string; color: string }) {
  const { getRunActivities } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  const runs = getRunActivities(habitId);
  if (runs.length === 0) return null;

  // Rolling 7 days rather than a calendar week — "what I've run recently"
  // is the useful read here, and it doesn't reset to zero every Monday.
  const weekStart = addDays(todayKey(), -6);
  const weekRuns = runs.filter((r) => r.date >= weekStart);
  const weekKm = weekRuns.reduce((sum, r) => sum + r.distanceKm, 0);
  const weekSec = weekRuns.reduce((sum, r) => sum + r.durationSec, 0);

  return (
    <View>
      <View style={styles.weekCard}>
        <View style={styles.weekStat}>
          <Text style={[styles.weekValue, { color }]}>{weekKm.toFixed(1)}</Text>
          <Text style={typography.caption}>km cette semaine</Text>
        </View>
        <View style={styles.weekStat}>
          <Text style={[styles.weekValue, { color }]}>{weekRuns.length}</Text>
          <Text style={typography.caption}>course{weekRuns.length > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.weekStat}>
          <Text style={[styles.weekValue, { color }]}>{formatDuration(weekSec)}</Text>
          <Text style={typography.caption}>temps total</Text>
        </View>
      </View>

      {runs.slice(0, MAX_SHOWN).map((run) => (
        <View key={run.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: color + '26' }]}>
              <Ionicons name="flame" size={16} color={color} />
            </View>
            <Text style={[typography.bodyBold, { flex: 1 }]}>{formatDayLabel(run.date)}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{run.distanceKm.toFixed(2)}</Text>
              <Text style={typography.small}>km</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatDuration(run.durationSec)}</Text>
              <Text style={typography.small}>temps</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatPace(run.distanceKm, run.durationSec)}</Text>
              <Text style={typography.small}>allure</Text>
            </View>
          </View>

          {run.route.length >= 2 && (
            <View style={{ marginTop: spacing.sm }}>
              <RouteMap route={run.route} height={120} color={color} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    weekCard: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    weekStat: { alignItems: 'center', gap: 2 },
    weekValue: { fontFamily: typography.display.fontFamily, fontSize: 22 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    iconWrap: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', gap: spacing.lg },
    stat: { gap: 2 },
    statValue: { fontFamily: typography.display.fontFamily, fontSize: 18 },
  });
}
