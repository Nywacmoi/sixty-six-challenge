import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { analyzeJawlinePhoto, JawlinePhotoResult } from '../firebase/aiSuggestions';
import { uriToBase64 } from '../utils/image';
import { storage } from '../storage/storage';
import { todayKey } from '../utils/date';

// Same opt-in-per-tap pattern as ProgressPhotoInsight (never fires on
// mount) — but here the AI is explicitly asked for a 1-10 score, since a
// jawline score is exactly what this module already tracks manually (the
// "Tour de mâchoire" cm measurement). The score is framed as a loose,
// motivational progress cue on the Cloud Function side, always paired
// with a forward-looking tip rather than a bare critique.
export function JawlinePhotoInsight({ habitId, photoUri }: { habitId: string; photoUri?: string }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const cacheKey = `jawlinephoto:${habitId}`;

  const [result, setResult] = useState<JawlinePhotoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(null);
    (async () => {
      const cached = await storage.getAiCache<JawlinePhotoResult>(cacheKey);
      if (!cancelled && cached && cached.date === todayKey()) setResult(cached.value);
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, photoUri]);

  // See ProgressPhotoInsight: rendering nothing before the photo hid the
  // feature entirely on every fresh day.
  if (!photoUri) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="sparkles-outline" size={16} color={colors.textTertiary} />
          <Text style={[typography.small, { color: colors.textTertiary, flex: 1 }]}>
            Ajoute ta photo du jour pour un score de l'IA sur ta mâchoire.
          </Text>
        </View>
      </View>
    );
  }

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await uriToBase64(photoUri);
      const analysis = await analyzeJawlinePhoto({ imageBase64: base64, mimeType });
      if (analysis.advice) {
        setResult(analysis);
        await storage.setAiCache(cacheKey, todayKey(), analysis);
      } else {
        setError("Échec — réessayer l'analyse IA");
      }
    } catch (e: any) {
      setError(
        e?.code === 'functions/unauthenticated'
          ? 'Crée un compte pour analyser ta photo'
          : "Échec — réessayer l'analyse IA"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {result ? (
        <View style={styles.row}>
          {result.score != null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{result.score}</Text>
              <Text style={styles.scoreOutOf}>/10</Text>
            </View>
          )}
          <Text style={[typography.body, { flex: 1 }]}>{result.advice}</Text>
        </View>
      ) : (
        <>
          <Pressable
            onPress={runAnalysis}
            disabled={loading}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel="Demander un score IA sur ta photo de mâchoire"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
            )}
            <Text style={[typography.bodyBold, { color: colors.accent, flex: 1 }]}>
              {loading ? 'Analyse de la photo…' : (error ?? "Demander un score à l'IA")}
            </Text>
          </Pressable>
          <Text style={[typography.small, { color: colors.textTertiary, marginTop: 4 }]}>
            Repère approximatif et motivant, pas un jugement — analysée de façon sécurisée, jamais partagée.
          </Text>
        </>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    scoreBadge: {
      flexDirection: 'row',
      alignItems: 'baseline',
      backgroundColor: colors.accent + '1F',
      borderRadius: radius.pill,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
    },
    scoreText: { fontFamily: typography.bodyBold.fontFamily, fontSize: 16, color: colors.accent },
    scoreOutOf: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.accent },
  });
}
