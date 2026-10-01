import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors } from '../theme/theme';
import { analyzeSkinPhoto, SkinPhotoResult } from '../firebase/aiSuggestions';
import { uriToBase64 } from '../utils/image';
import { storage } from '../storage/storage';
import { todayKey } from '../utils/date';
import { frenchSpacing } from '../utils/frenchSpacing';
import { AppIcon } from './AppIcon';

// The skincare module's photo analysis. Same opt-in-per-tap contract as the
// jawline and sport insights — it never calls the model on its own — but it
// returns more than one number, and it remembers them.
//
// A skin score on its own day means little: lighting alone moves it. What
// the person wants is the direction, so every analysis logs its overall
// score as a metric (one per day — re-analysing overwrites) and the card
// shows the run of them and the change since the first. Metrics are part of
// the export and the cloud backup, so the history survives a new phone.
//
// The cached result is tied to the photo it came from: changing today's
// photo shows the button again instead of yesterday's verdict on a picture
// that's no longer there.

const SUBSCORES: { key: 'eclat' | 'uniformite' | 'nettete'; label: string }[] = [
  { key: 'eclat', label: 'Éclat' },
  { key: 'uniformite', label: 'Teint uniforme' },
  { key: 'nettete', label: 'Peau nette' },
];
const HISTORY_SHOWN = 14;

type Cached = { photoKey: string; result: SkinPhotoResult };

// Enough to tell two photos apart; not a security measure.
function photoKeyOf(uri: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < uri.length; i += 97) h = Math.imul(h ^ uri.charCodeAt(i), 0x01000193);
  return `${(h >>> 0).toString(16)}:${uri.length}`;
}

export function SkinPhotoInsight({ habitId, photoUri, color }: { habitId: string; photoUri?: string; color: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { logMetric, getMetricHistory } = useApp();
  const cacheKey = `skinphoto:${habitId}`;
  const metricKey = `skin:${habitId}`;

  const [result, setResult] = useState<SkinPhotoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(null);
    if (!photoUri) return;
    storage.getAiCache<Cached>(cacheKey).then((cached) => {
      if (!cancelled && cached && cached.date === todayKey() && cached.value.photoKey === photoKeyOf(photoUri)) {
        setResult(cached.value.result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, photoUri]);

  const history = getMetricHistory(metricKey);
  const first = history[0];
  const latest = history[history.length - 1];

  const runAnalysis = async () => {
    if (!photoUri) return;
    setLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await uriToBase64(photoUri);
      const analysis = await analyzeSkinPhoto({ imageBase64: base64, mimeType });
      if (!analysis.advice) {
        setError('Échec — réessayer l’analyse');
        return;
      }
      setResult(analysis);
      await storage.setAiCache<Cached>(cacheKey, todayKey(), { photoKey: photoKeyOf(photoUri), result: analysis });
      if (analysis.visible && analysis.score != null) await logMetric(metricKey, analysis.score);
    } catch (e: any) {
      setError(e?.code === 'functions/unauthenticated' ? 'Crée un compte pour analyser ta photo' : 'Échec — réessayer l’analyse');
    } finally {
      setLoading(false);
    }
  };

  if (!photoUri) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <AppIcon name="sparkles-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.muted, { flex: 1 }]}>
            Ajoute une photo de ton visage pour l’analyse IA de ta peau. Même lumière, même angle à chaque fois — sinon la
            comparaison ne veut rien dire.
          </Text>
        </View>
        {history.length > 0 && <Trend history={history} color={color} styles={styles} />}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {result && result.visible && result.score != null ? (
        <>
          <View style={styles.headline}>
            <Text style={[styles.score, { color }]}>
              {result.score}
              <Text style={styles.outOf}>/10</Text>
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.headTitle}>Ta peau aujourd’hui</Text>
              {first && latest && history.length > 1 && (
                <Text style={styles.muted}>
                  {latest.value - first.value >= 0 ? '+' : ''}
                  {latest.value - first.value} depuis ta première analyse
                </Text>
              )}
            </View>
          </View>

          {SUBSCORES.map(({ key, label }) => {
            const v = result[key];
            if (v == null) return null;
            return (
              <View key={key} style={styles.sub}>
                <Text style={styles.subLabel}>{label}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${v * 10}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.subValue}>{v}</Text>
              </View>
            );
          })}

          {!!result.focus && (
            <Text style={styles.focus}>
              À travailler{' '}: <Text style={{ color }}>{frenchSpacing(result.focus)}</Text>
            </Text>
          )}
          <Text style={styles.advice}>{frenchSpacing(result.advice)}</Text>
          {history.length > 1 && <Trend history={history} color={color} styles={styles} />}
        </>
      ) : result && !result.visible ? (
        <>
          <Text style={styles.advice}>{frenchSpacing(result.advice)}</Text>
          <AnalyzeButton loading={loading} error={error} onPress={runAnalysis} color={color} styles={styles} again />
        </>
      ) : (
        <>
          <AnalyzeButton loading={loading} error={error} onPress={runAnalysis} color={color} styles={styles} />
          <Text style={[styles.muted, { marginTop: 4 }]}>
            Repère approximatif pour suivre ton évolution, pas un jugement — et jamais un diagnostic. Analysée de façon
            sécurisée, jamais partagée.
          </Text>
          {history.length > 0 && <Trend history={history} color={color} styles={styles} />}
        </>
      )}
    </View>
  );
}

function AnalyzeButton({
  loading,
  error,
  onPress,
  color,
  styles,
  again,
}: {
  loading: boolean;
  error: string | null;
  onPress: () => void;
  color: string;
  styles: ReturnType<typeof createStyles>;
  again?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={[styles.row, { marginTop: again ? spacing.sm : 0 }]} accessibilityRole="button">
      {loading ? <ActivityIndicator size="small" color={color} /> : <AppIcon name="sparkles" size={16} color={color} />}
      <Text style={[styles.action, { color }]}>
        {loading ? 'Analyse de ta peau…' : (error ?? (again ? 'Analyser à nouveau' : 'Analyser ma peau avec l’IA'))}
      </Text>
    </Pressable>
  );
}

// One bar per analysis, oldest to newest: the direction at a glance.
function Trend({
  history,
  color,
  styles,
}: {
  history: { date: string; value: number }[];
  color: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const shown = history.slice(-HISTORY_SHOWN);
  return (
    <View style={styles.trend}>
      <Text style={styles.trendLabel}>
        {history.length} ANALYSE{history.length > 1 ? 'S' : ''}
      </Text>
      <View style={styles.bars}>
        {shown.map((m, i) => (
          <View
            key={m.date}
            style={[styles.bar, { height: 4 + m.value * 3, backgroundColor: color, opacity: i === shown.length - 1 ? 1 : 0.45 }]}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    muted: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textTertiary },
    action: { fontFamily: fonts.bold, fontSize: 15, flex: 1 },
    headline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    score: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -1.5 },
    outOf: { fontFamily: fonts.bold, fontSize: 15, color: colors.textTertiary },
    headTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
    sub: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 8 },
    subLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, width: 104 },
    track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceElevated, overflow: 'hidden' },
    fill: { height: 5, borderRadius: 3 },
    subValue: { fontFamily: fonts.bold, fontSize: 12, color: colors.text, width: 18, textAlign: 'right' },
    focus: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary, marginTop: spacing.md },
    advice: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: spacing.xs },
    trend: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    trendLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.4, color: colors.textTertiary },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 36, marginTop: spacing.sm },
    bar: { flex: 1, maxWidth: 14, borderRadius: 3 },
  });
}
