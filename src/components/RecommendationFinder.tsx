import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { DiscoveryCategory } from '../data/discoveryCategories';

type SearchTarget = { label: string; icon: keyof typeof Ionicons.glyphMap; buildUrl: (query: string) => string };

const PODCAST_TARGETS: SearchTarget[] = [
  { label: 'Spotify', icon: 'musical-notes', buildUrl: (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}` },
  { label: 'Apple Podcasts', icon: 'logo-apple', buildUrl: (q) => `https://podcasts.apple.com/search?term=${encodeURIComponent(q)}` },
];

const BOOK_TARGETS: SearchTarget[] = [
  { label: 'Google Livres', icon: 'book', buildUrl: (q) => `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(q)}` },
  { label: 'Fnac', icon: 'storefront', buildUrl: (q) => `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${encodeURIComponent(q)}` },
];

// Not a real AI recommender (that would need an LLM API + a backend to
// hold the key securely) — this is an honest, quick substitute: pick a
// mood/category, get real search links pre-filled for it. Kept as its own
// small "quiz" step to match the conversational feel asked for, without
// pretending to be something it isn't.
export function RecommendationFinder({
  title,
  categories,
  kind,
}: {
  title: string;
  categories: DiscoveryCategory[];
  kind: 'podcast' | 'book';
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const [selected, setSelected] = useState<DiscoveryCategory | null>(null);
  const targets = kind === 'podcast' ? PODCAST_TARGETS : BOOK_TARGETS;

  return (
    <View>
      <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>{title}</Text>
      <View style={styles.chipRow}>
        {categories.map((c) => {
          const active = selected?.id === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelected(c)}
              style={[styles.chip, active && { backgroundColor: colors.accent + '1F', borderColor: colors.accent }]}
            >
              <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
              <Text style={[typography.bodyBold, active && { color: colors.accent }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected && (
        <View style={styles.card}>
          <Text style={typography.caption}>CHERCHER "{selected.label.toUpperCase()}"</Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {targets.map((t) => (
              <Pressable key={t.label} style={styles.targetRow} onPress={() => Linking.openURL(t.buildUrl(selected.query))}>
                <Ionicons name={t.icon} size={18} color={colors.accent} />
                <Text style={[typography.bodyBold, { color: colors.accent, flex: 1 }]}>Ouvrir sur {t.label}</Text>
                <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    targetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  });
}
