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

const GREETINGS = ['Salut {name}', 'Hey {name} !', 'Bonjour {name}', '{name}, prêt(e) pour aujourd\'hui ?'];

const MOODS = [
  { icon: 'bed', label: 'Fatigué' },
  { icon: 'remove', label: 'Moyen' },
  { icon: 'happy', label: 'Bien' },
  { icon: 'flame', label: 'En feu' },
];

const MOOD_REACTIONS: Record<string, string> = {
  Fatigué: 'Pas de souci, on y va doucement — un petit pas suffit à garder la série.',
  Moyen: 'Ça arrive à tout le monde, une habitude cochée et ça ira déjà mieux.',
  Bien: "Top, autant en profiter aujourd'hui.",
  'En feu': "J'adore cette énergie. Direction le prochain jour du défi.",
};

const SLEEPS = [
  { icon: 'sad', label: 'Mal dormi' },
  { icon: 'remove', label: 'Sommeil moyen' },
  { icon: 'happy', label: 'Bien dormi' },
  { icon: 'star', label: 'Nuit parfaite' },
];

const SLEEP_REACTIONS: Record<string, string> = {
  'Mal dormi': 'Pense à toi ce soir — une bonne nuit, ça change tout.',
  'Sommeil moyen': 'Correct, on fait avec !',
  'Bien dormi': 'Parfait pour attaquer la journée.',
  'Nuit parfaite': "Un vrai carburant pour aujourd'hui.",
};

// A few common habits not already on the list — offered as "want to add one
// today?" rather than the full catalogue, to keep this quick.
const SUGGESTION_COUNT = 4;

type Step = 'mood' | 'moodReaction' | 'sleep' | 'sleepReaction' | 'routine';

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
  const { profile, habits, currentDay, addHabitsBulk, updateProfile } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const [step, setStep] = useState<Step>('mood');
  const [mood, setMood] = useState<string | null>(null);
  const [sleep, setSleep] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const firstName = profile.name?.trim().split(/\s+/)[0] || 'toi';
  const existingNames = new Set(habits.map((h) => h.name.trim().toLowerCase()));
  const suggestions = COMMON_HABITS.filter((h) => !existingNames.has(h.name.trim().toLowerCase())).slice(0, SUGGESTION_COUNT);

  const greetingTemplate = GREETINGS[Math.max(0, currentDay) % GREETINGS.length];
  const greeting = useTypewriter(greetingTemplate.replace('{name}', firstName));

  const question =
    step === 'mood'
      ? "Comment tu te sens aujourd'hui ?"
      : step === 'moodReaction'
        ? MOOD_REACTIONS[mood ?? ''] ?? ''
        : step === 'sleep'
          ? 'Et cette nuit, tu as bien dormi ?'
          : step === 'sleepReaction'
            ? SLEEP_REACTIONS[sleep ?? ''] ?? ''
            : `Jour ${currentDay} sur 99 — une routine à ajouter aujourd'hui ?`;
  const revealedQuestion = useTypewriter(question);

  const finish = async () => {
    await updateProfile({ lastCheckInDate: todayKey() });
  };

  const pickMood = (label: string) => {
    setMood(label);
    setStep('moodReaction');
    setTimeout(() => setStep('sleep'), 1500);
  };

  const pickSleep = (label: string) => {
    setSleep(label);
    setStep('sleepReaction');
    setTimeout(() => setStep('routine'), 1500);
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
              <Pressable key={m.label} onPress={() => pickMood(m.label)} style={styles.moodChip}>
                <Ionicons name={m.icon as any} size={22} color={colors.accent} />
                <Text style={typography.caption}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 'sleep' && (
          <View style={styles.moodRow}>
            {SLEEPS.map((s) => (
              <Pressable key={s.label} onPress={() => pickSleep(s.label)} style={styles.moodChip}>
                <Ionicons name={s.icon as any} size={22} color={colors.accent} />
                <Text style={typography.caption}>{s.label}</Text>
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
                        <Ionicons name={h.icon as any} size={18} color={h.color} />
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
