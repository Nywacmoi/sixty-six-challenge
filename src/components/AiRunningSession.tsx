import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { generateRunningSession, AiRunningSegment } from '../firebase/aiSuggestions';
import { storage } from '../storage/storage';
import { todayKey } from '../utils/date';
import { RunningSegment } from '../data/runningPrograms';
import { AppIcon } from './AppIcon';

// Same "AI first, cached daily, static fallback on any failure" pattern as
// AiWorkoutSession/AiJawlineSession — see those for the reasoning. No
// video-demo button here since a running segment ("Footing 30 min") isn't
// a technique to look up the way a lifting exercise is.
export function AiRunningSession({
  programId,
  programLabel,
  fallbackSegments,
}: {
  programId: string;
  programLabel: string;
  fallbackSegments: RunningSegment[];
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const cacheKey = `running:${programId}`;

  const [segments, setSegments] = useState<(AiRunningSegment | RunningSegment)[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const cached = await storage.getAiCache<AiRunningSegment[]>(cacheKey);
      if (cached && cached.date === todayKey()) {
        if (!cancelled) {
          setSegments(cached.value);
          setLoading(false);
        }
        return;
      }
      try {
        const result = await generateRunningSession({ programLabel });
        if (cancelled) return;
        if (result.length > 0) {
          setSegments(result);
          await storage.setAiCache(cacheKey, todayKey(), result);
        } else {
          setSegments(fallbackSegments);
        }
      } catch {
        if (!cancelled) setSegments(fallbackSegments);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const shown = segments ?? fallbackSegments;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <AppIcon name="sparkles" size={11} color={colors.accent} />
          <Text style={[typography.small, { color: colors.accent }]}>SÉANCE DU JOUR</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: spacing.md }} />
      ) : (
        shown.map((seg, i) => (
          <View key={`${seg.name}-${i}`} style={styles.segmentRow}>
            <View style={styles.durationWrap}>
              <Text style={styles.durationText}>{seg.duration}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{seg.name}</Text>
              {seg.pace && <Text style={typography.caption}>{seg.pace}</Text>}
              {seg.tip && <Text style={[typography.small, { marginTop: 4 }]}>{seg.tip}</Text>}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
    headerRow: { flexDirection: 'row', marginBottom: 4 },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent + '14',
      borderRadius: radius.pill,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
    },
    segmentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    durationWrap: {
      minWidth: 56,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      paddingVertical: 6,
      paddingHorizontal: spacing.xs,
    },
    durationText: { fontFamily: typography.bodyBold.fontFamily, fontSize: 12, color: colors.text },
  });
}
