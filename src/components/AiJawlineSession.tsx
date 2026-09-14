import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { generateJawlineRoutine, AiJawlineExercise } from '../firebase/aiSuggestions';
import { storage } from '../storage/storage';
import { todayKey } from '../utils/date';
import { JawlineExercise } from '../data/jawlineProgram';
import { AppIcon } from './AppIcon';

function openSearch(query: string) {
  Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
}

// Same "Programme jawline" card as before, fed by Claude instead of the
// fixed 3-exercise list per category — one AI call per day per session,
// cached locally, falling back to the existing static JAWLINE_SESSIONS
// entry the moment anything about the AI path fails.
export function AiJawlineSession({
  sessionId,
  sessionLabel,
  fallbackExercises,
}: {
  sessionId: string;
  sessionLabel: string;
  fallbackExercises: JawlineExercise[];
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const cacheKey = `jawline:${sessionId}`;

  const [exercises, setExercises] = useState<(AiJawlineExercise | JawlineExercise)[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const cached = await storage.getAiCache<AiJawlineExercise[]>(cacheKey);
      if (cached && cached.date === todayKey()) {
        if (!cancelled) {
          setExercises(cached.value);
          setLoading(false);
        }
        return;
      }
      try {
        const result = await generateJawlineRoutine({ sessionLabel });
        if (cancelled) return;
        if (result.length > 0) {
          setExercises(result);
          await storage.setAiCache(cacheKey, todayKey(), result);
        } else {
          setExercises(fallbackExercises);
        }
      } catch {
        if (!cancelled) setExercises(fallbackExercises);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const shown = exercises ?? fallbackExercises;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <AppIcon name="sparkles" size={11} color={colors.accent} />
          <Text style={[typography.small, { color: colors.accent }]}>PROGRAMME DU JOUR</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: spacing.md }} />
      ) : (
        shown.map((ex) => (
          <View key={ex.name} style={styles.exerciseRow}>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{ex.name}</Text>
              <Text style={typography.caption}>{ex.reps}</Text>
              <Text style={[typography.small, { marginTop: 4 }]}>{ex.tip}</Text>
            </View>
            <Pressable
              onPress={() => openSearch(`${ex.name} exercice jawline`)}
              hitSlop={8}
              style={styles.videoBtn}
              accessibilityRole="button"
              accessibilityLabel={`Voir une vidéo de démonstration : ${ex.name}`}
            >
              <Ionicons name="logo-youtube" size={22} color={colors.danger} />
            </Pressable>
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
    exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    videoBtn: { padding: 2 },
  });
}
