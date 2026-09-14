import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { ExerciseAnimation, MovementPattern } from './ExerciseAnimation';
import { generateWorkoutSession, AiExercise } from '../firebase/aiSuggestions';
import { storage } from '../storage/storage';
import { todayKey } from '../utils/date';
import { Exercise } from '../data/workoutSplits';

function openSearch(query: string) {
  Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
}

// AI exercises come back as plain {name, reps} — no `pattern`, since asking
// the model to pick from an internal enum reliably wasn't worth the risk of
// a malformed value crashing the animation. Guessed from French exercise
// vocabulary instead; 'hold' is the safe default for anything unmatched
// (a static pose reads fine even for an exercise it doesn't really fit).
function inferPattern(name: string): MovementPattern {
  const n = name.toLowerCase();
  if (/squat|fente|presse|jambe/.test(n)) return 'squat';
  if (/pomp|développ|dips|push/.test(n)) return 'push';
  if (/tirage|rowing|traction|pull/.test(n)) return 'pull';
  if (/curl/.test(n)) return 'curl';
  if (/élévation|elevation|shrug|raise/.test(n)) return 'raise';
  if (/crunch|abdo|russian|twist|vélo|mountain/.test(n)) return 'crunch';
  if (/course|corde|marche|rameur|vélo|natation|boxe|burpee/.test(n)) return 'run';
  return 'hold';
}

// Same "Séance du jour" card as before, just fed by Claude instead of
// cycling through 2-3 fixed variants per split — one real AI call per day
// per (split, goal, level) combo, cached locally. Falls back to
// `fallbackExercises` (the existing dailyIndex-picked variant from
// data/workoutSplits.ts) the moment anything about the AI path fails, so
// this never shows an empty or broken session.
export function AiWorkoutSession({
  splitId,
  splitLabel,
  goal,
  level,
  fallbackExercises,
}: {
  splitId: string;
  splitLabel: string;
  goal?: string;
  level?: string;
  fallbackExercises: Exercise[];
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const cacheKey = `workout:${splitId}:${goal ?? ''}:${level ?? ''}`;

  const [exercises, setExercises] = useState<(AiExercise | Exercise)[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const cached = await storage.getAiCache<AiExercise[]>(cacheKey);
      if (cached && cached.date === todayKey()) {
        if (!cancelled) {
          setExercises(cached.value);
          setLoading(false);
        }
        return;
      }
      try {
        const result = await generateWorkoutSession({ splitLabel, goal, level });
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
      <View style={[styles.headerRow]}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={11} color={colors.accent} />
          <Text style={[typography.small, { color: colors.accent }]}>SÉANCE DU JOUR</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: spacing.md }} />
      ) : (
        shown.map((ex) => (
          <View key={ex.name} style={styles.exerciseRow}>
            <ExerciseAnimation pattern={'pattern' in ex ? ex.pattern : inferPattern(ex.name)} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{ex.name}</Text>
              <Text style={typography.caption}>{ex.reps}</Text>
              {'alt' in ex && ex.alt && <Text style={[typography.small, { marginTop: 4 }]}>{ex.alt}</Text>}
            </View>
            <Pressable
              onPress={() => openSearch(`${ex.name} technique musculation`)}
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
