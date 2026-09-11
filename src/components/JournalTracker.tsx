import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { Habit } from '../types';
import { generateJournalPrompt } from '../firebase/journal';
import { scrollFocusedIntoView } from '../utils/scrollFocusedIntoView';
import { formatDayLabel } from '../utils/date';

// Same list as the Cloud Function's own fallback (functions/index.js) — used
// here when the call itself fails (offline, not signed in, function not
// deployed yet), so a AI prompt never being reachable degrades to "still a
// real prompt" rather than a broken screen.
const LOCAL_FALLBACK_PROMPTS = [
  "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
  "Quelle petite victoire as-tu eue aujourd'hui, même minime ?",
  "Qu'est-ce que tu as appris sur toi-même récemment ?",
  'De quoi es-tu reconnaissant·e en ce moment ?',
];

export function JournalTracker({ habit }: { habit: Habit }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const { getStreak, getTodayJournalEntry, saveJournalEntry, getJournalEntries } = useApp();

  const todayEntry = getTodayJournalEntry(habit.id);
  const pastEntries = getJournalEntries(habit.id)
    .filter((e) => e.date !== todayEntry?.date)
    .slice(-5)
    .reverse();

  const [prompt, setPrompt] = useState(todayEntry?.prompt ?? '');
  const [loadingPrompt, setLoadingPrompt] = useState(!todayEntry);
  const [text, setText] = useState(todayEntry?.text ?? '');
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    if (todayEntry) return;
    let cancelled = false;
    (async () => {
      try {
        const generated = await generateJournalPrompt({ streak: getStreak(habit.id) });
        if (!cancelled) setPrompt(generated);
      } catch {
        if (!cancelled) setPrompt(LOCAL_FALLBACK_PROMPTS[Math.floor(Math.random() * LOCAL_FALLBACK_PROMPTS.length)]);
      } finally {
        if (!cancelled) setLoadingPrompt(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit.id, todayEntry?.date]);

  const save = async (nextText: string) => {
    await saveJournalEntry(habit.id, prompt, nextText);
    setSaved(true);
  };

  return (
    <View style={styles.card}>
      <View style={styles.promptRow}>
        <Ionicons name="sparkles" size={16} color={colors.accent} />
        {loadingPrompt ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>{prompt}</Text>
        )}
      </View>

      {!loadingPrompt && (
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            setSaved(false);
          }}
          onFocus={scrollFocusedIntoView}
          onBlur={() => {
            if (!saved) save(text);
          }}
          placeholder="Écris ce qui te passe par la tête..."
          placeholderTextColor={colors.textTertiary}
          multiline
          style={styles.input}
        />
      )}

      {!loadingPrompt && (
        <Pressable
          onPress={() => save(text)}
          disabled={saved}
          style={[styles.saveBtn, saved && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer l'entrée du journal"
        >
          <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>{saved ? 'Enregistré' : 'Enregistrer'}</Text>
        </Pressable>
      )}

      {pastEntries.length > 0 && (
        <View style={styles.history}>
          <Text style={[typography.caption, { marginBottom: spacing.sm }]}>ENTRÉES PRÉCÉDENTES</Text>
          {pastEntries.map((entry) => (
            <View key={entry.date} style={styles.historyRow}>
              <Text style={[typography.small, { color: colors.textTertiary }]}>{formatDayLabel(entry.date)}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={2}>
                {entry.text || entry.prompt}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    promptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    input: {
      marginTop: spacing.md,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      color: colors.text,
      fontSize: 15,
      minHeight: 90,
      textAlignVertical: 'top',
    },
    saveBtn: {
      marginTop: spacing.sm,
      alignSelf: 'flex-end',
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: 8,
      paddingHorizontal: spacing.lg,
    },
    history: { marginTop: spacing.lg, gap: spacing.sm },
    historyRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: 2 },
  });
}
