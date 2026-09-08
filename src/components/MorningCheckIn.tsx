import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { todayKey } from '../utils/date';
import { COMMON_HABITS } from '../data/commonHabits';
import { PrimaryButton } from './PrimaryButton';

const MOODS = [
  { emoji: '😴', label: 'Fatigué' },
  { emoji: '😐', label: 'Moyen' },
  { emoji: '🙂', label: 'Bien' },
  { emoji: '🔥', label: 'En feu' },
];

// A few common habits not already on the list — offered as "want to add one
// today?" rather than the full catalogue, to keep this quick.
const SUGGESTION_COUNT = 4;

// Reveals `text` a few characters at a time — the "AI is typing" feel from
// the reference, reinterpreted with this app's own colors instead of a
// fixed dark palette (kept theme-aware, not copied verbatim).
function useTypewriter(text: string, speed = 18) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return shown;
}

export function MorningCheckIn() {
  const { profile, habits, addHabitsBulk, updateProfile } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const [step, setStep] = useState<'mood' | 'routine'>('mood');
  const [mood, setMood] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const firstName = profile.name?.trim().split(/\s+/)[0] || 'toi';
  const existingNames = new Set(habits.map((h) => h.name.trim().toLowerCase()));
  const suggestions = COMMON_HABITS.filter((h) => !existingNames.has(h.name.trim().toLowerCase())).slice(0, SUGGESTION_COUNT);

  const greeting = useTypewriter(`Salut ${firstName} 👋`);
  const question =
    step === 'mood' ? 'Comment tu te sens aujourd\'hui ?' : 'Une routine à ajouter à ton défi aujourd\'hui ?';
  const revealedQuestion = useTypewriter(question);

  const finish = async () => {
    await updateProfile({ lastCheckInDate: todayKey() });
  };

  const pickMood = (label: string) => {
    setMood(label);
    setTimeout(() => setStep('routine'), 350);
  };

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const confirmRoutine = async () => {
    const toAdd = suggestions.filter((h) => checked.has(h.name));
    if (toAdd.length > 0) await addHabitsBulk(toAdd);
    await finish();
  };

  return (
    <Animated.View style={[styles.overlay, { paddingTop: topInset + spacing.xl, opacity: fadeIn }]}>
      <View style={styles.content}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
        <Text style={[styles.question, { color: colors.text }]}>{revealedQuestion}</Text>

        {step === 'mood' && (
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.label}
                onPress={() => pickMood(m.label)}
                style={[styles.moodChip, mood === m.label && { borderColor: colors.accent, backgroundColor: colors.accent + '1A' }]}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[typography.caption, mood === m.label && { color: colors.accent }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 'routine' && (
          <>
            {suggestions.length > 0 ? (
              <View style={styles.list}>
                {suggestions.map((h) => {
                  const active = checked.has(h.name);
                  return (
                    <Pressable key={h.name} onPress={() => toggle(h.name)} style={styles.row}>
                      <View style={[styles.iconWrap, { backgroundColor: h.color + '26' }]}>
                        <Text style={{ fontSize: 18 }}>{h.icon}</Text>
                      </View>
                      <Text style={[typography.body, { flex: 1 }]}>{h.name}</Text>
                      <Ionicons name={active ? 'checkbox' : 'square-outline'} size={22} color={active ? colors.accent : colors.textTertiary} />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={[typography.caption, { marginTop: spacing.lg }]}>
                Tu as déjà de quoi faire — direction ta journée.
              </Text>
            )}

            <PrimaryButton
              label={checked.size > 0 ? `Ajouter (${checked.size}) et commencer` : 'Commencer ma journée'}
              onPress={confirmRoutine}
              style={{ marginTop: spacing.xl }}
            />
            {checked.size === 0 && (
              <Pressable onPress={finish} style={{ marginTop: spacing.md, alignItems: 'center' }}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>Passer</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      zIndex: 200,
      paddingHorizontal: spacing.lg,
    },
    content: { flex: 1, justifyContent: 'center', paddingBottom: spacing.xxl },
    greeting: { fontFamily: typography.body.fontFamily, fontSize: 16, marginBottom: spacing.sm },
    question: { fontFamily: typography.display.fontFamily, fontSize: 26, lineHeight: 32 },
    moodRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, flexWrap: 'wrap' },
    moodChip: {
      alignItems: 'center',
      gap: 4,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      minWidth: 76,
    },
    moodEmoji: { fontSize: 26 },
    list: { marginTop: spacing.xl, gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    iconWrap: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  });
}
