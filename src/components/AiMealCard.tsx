import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { generateMealIdea } from '../firebase/aiSuggestions';
import { storage } from '../storage/storage';
import { todayKey } from '../utils/date';
import { AppIcon } from './AppIcon';

function openSearch(query: string) {
  Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
}

// Same card as before (icon + text + recipe video button), just fed by
// Claude instead of a fixed 7-item pool — one real AI call per day per
// (meal type, diet) combo, cached locally so re-opening the screen doesn't
// re-generate. Falls back to `fallbackText` (the existing dailyIndex pick
// from data/mealIdeas.ts) the moment anything about the AI path fails.
export function AiMealCard({ mealType, diet, fallbackText }: { mealType: string; diet: string; fallbackText: string }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const cacheKey = `meal:${mealType}:${diet}`;

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const cached = await storage.getAiCache<string>(cacheKey);
      if (cached && cached.date === todayKey()) {
        if (!cancelled) {
          setText(cached.value);
          setLoading(false);
        }
        return;
      }
      try {
        const idea = await generateMealIdea({ mealType, diet });
        if (cancelled) return;
        if (idea) {
          setText(idea);
          await storage.setAiCache(cacheKey, todayKey(), idea);
        } else {
          setText(fallbackText);
        }
      } catch {
        if (!cancelled) setText(fallbackText);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const shown = text ?? fallbackText;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <AppIcon name="sparkles" size={16} color={colors.accent} />
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[typography.body, { flex: 1 }]}>{shown}</Text>
        )}
        {!loading && (
          <Pressable
            onPress={() => openSearch(`${shown} recette facile`)}
            hitSlop={8}
            style={styles.videoBtn}
            accessibilityRole="button"
            accessibilityLabel="Voir une recette vidéo pour cette idée de repas"
          >
            <Ionicons name="logo-youtube" size={22} color={colors.danger} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    videoBtn: { padding: 2 },
  });
}
