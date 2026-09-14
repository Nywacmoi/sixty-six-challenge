import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { analyzeProgressPhoto } from '../firebase/aiSuggestions';
import { uriToBase64 } from '../utils/image';
import { storage } from '../storage/storage';
import { todayKey } from '../utils/date';

// Unlike AiMealCard/AiWorkoutSession, this never fires on mount — sending a
// personal body photo to the AI is opt-in via an explicit tap each time,
// not something that happens the moment a photo is saved. The prompt on
// the Cloud Function side also never asks the model to assess appearance,
// weight, or body composition — see functions/index.js.
export function ProgressPhotoInsight({
  habitId,
  photoUri,
  goal,
  level,
}: {
  habitId: string;
  photoUri?: string;
  goal?: string;
  level?: string;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const cacheKey = `bodyphoto:${habitId}`;

  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAdvice(null);
    setFailed(false);
    (async () => {
      const cached = await storage.getAiCache<string>(cacheKey);
      if (!cancelled && cached && cached.date === todayKey()) setAdvice(cached.value);
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, photoUri]);

  if (!photoUri) return null;

  const runAnalysis = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { base64, mimeType } = await uriToBase64(photoUri);
      const result = await analyzeProgressPhoto({ imageBase64: base64, mimeType, goal, level });
      if (result) {
        setAdvice(result);
        await storage.setAiCache(cacheKey, todayKey(), result);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {advice ? (
        <View style={styles.row}>
          <Ionicons name="sparkles" size={16} color={colors.accent} />
          <Text style={[typography.body, { flex: 1 }]}>{advice}</Text>
        </View>
      ) : (
        <>
          <Pressable onPress={runAnalysis} disabled={loading} style={styles.row} accessibilityRole="button" accessibilityLabel="Demander un conseil à l'IA sur ta photo de progression">
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
            )}
            <Text style={[typography.bodyBold, { color: colors.accent, flex: 1 }]}>
              {loading ? 'Analyse de la photo…' : failed ? "Échec — réessayer l'analyse IA" : "Demander un conseil à l'IA"}
            </Text>
          </Pressable>
          <Text style={[typography.small, { color: colors.textTertiary, marginTop: 4 }]}>Analysée de façon sécurisée, jamais partagée.</Text>
        </>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  });
}
