import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView, Platform, UIManager, LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { todayKey } from '../utils/date';
import { COMMON_HABITS } from '../data/commonHabits';
import { getHabitCategories } from '../utils/habitCategories';
import { PrimaryButton } from './PrimaryButton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

type Step = 'mood' | 'sleep' | 'routine';
const STEP_ORDER: Step[] = ['mood', 'sleep', 'routine'];

type HistoryEntry = { bot: string; answer: string };

const TYPEWRITER_SPEED = 18;

// Reveals `text` a few characters at a time — the "AI is typing" feel from
// the reference, reinterpreted with this app's own colors instead of a
// fixed dark palette (kept theme-aware, not copied verbatim).
function useTypewriter(text: string, speed = TYPEWRITER_SPEED) {
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
  const { colors, typography, mode } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const [step, setStep] = useState<Step>('mood');
  // Answered questions stay on screen instead of being replaced — each past
  // exchange dims into scrollback (bot line + the person's own answer as a
  // chat-style chip) while the live one stays bright below, the same
  // conversational pattern as the reference: a running thread, not a
  // sequence of screens that wipe each other.
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [sleep, setSleep] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const fadeIn = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const blockIn = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length,
      duration: 350,
      useNativeDriver: false,
    }).start();
    blockIn.setValue(0);
    Animated.timing(blockIn, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [step]);

  const firstName = profile.name?.trim().split(/\s+/)[0] || 'toi';
  const existingNames = new Set(habits.map((h) => h.name.trim().toLowerCase()));
  // Habit stacking: prioritize suggestions that share a theme with what the
  // person already does (sport, sommeil, méditation...) over the generic
  // catalogue order, so "ajouter une routine" builds on their existing
  // habits rather than throwing an unrelated one at them.
  const userCategories = new Set(habits.flatMap((h) => getHabitCategories(h.name, h.icon)));
  const notAdded = COMMON_HABITS.filter((h) => !existingNames.has(h.name.trim().toLowerCase()));
  const related = notAdded.filter((h) => getHabitCategories(h.name, h.icon).some((c) => userCategories.has(c)));
  const unrelated = notAdded.filter((h) => !related.includes(h));
  const suggestions = [...related, ...unrelated].slice(0, SUGGESTION_COUNT);

  const greetingTemplate = GREETINGS[Math.max(0, currentDay) % GREETINGS.length];
  const greeting = greetingTemplate.replace('{name}', firstName);

  const moodQuestion = "Comment tu te sens aujourd'hui ?";
  const sleepQuestion = 'Et cette nuit, tu as bien dormi ?';
  const routineQuestion = `Jour ${currentDay} sur 99 — une routine à ajouter aujourd'hui ?`;

  const currentBotText =
    step === 'mood'
      ? moodQuestion
      : step === 'sleep'
        ? `${MOOD_REACTIONS[mood ?? ''] ?? ''} ${sleepQuestion}`
        : `${SLEEP_REACTIONS[sleep ?? ''] ?? ''} ${routineQuestion}`;
  const revealedText = useTypewriter(currentBotText);

  const finish = async () => {
    await updateProfile({ lastCheckInDate: todayKey() });
  };

  const pickMood = (label: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistory((h) => [...h, { bot: moodQuestion, answer: label }]);
    setMood(label);
    setStep('sleep');
  };

  const pickSleep = (label: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistory((h) => [...h, { bot: `${MOOD_REACTIONS[mood ?? ''] ?? ''} ${sleepQuestion}`, answer: label }]);
    setSleep(label);
    setStep('routine');
  };

  // One step back at a time, like the reference's back chevron — pop the
  // last exchange out of the scrollback and clear the answer it held so the
  // chips for that step are re-selectable.
  const goBack = () => {
    if (step === 'mood') return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistory((h) => h.slice(0, -1));
    if (step === 'sleep') {
      setMood(null);
      setStep('mood');
    } else if (step === 'routine') {
      setSleep(null);
      setStep('sleep');
    }
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
    <Animated.View style={[styles.overlay, { opacity: fadeIn }]}>
      {mode === 'dark' && (
        <LinearGradient
          colors={['#000000', '#000000', colors.accent + '17']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      <View style={{ flex: 1, paddingTop: topInset + spacing.md, paddingHorizontal: spacing.lg }}>
        <View style={styles.topRow}>
          <Pressable
            onPress={goBack}
            disabled={step === 'mood'}
            style={[styles.backBtn, { opacity: step === 'mood' ? 0 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Revenir à la question précédente"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: colors.accent, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {history.map((entry, i) => (
            <View key={i} style={styles.historyBlock}>
              <Text style={[styles.historyBot, { color: colors.textTertiary }]}>{entry.bot}</Text>
              <View style={styles.answerRow}>
                <View style={[styles.answerChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Text style={[styles.answerChipText, { color: colors.text }]}>{entry.answer}</Text>
                </View>
              </View>
            </View>
          ))}

          <Animated.View
            style={{
              opacity: blockIn,
              transform: [{ translateY: blockIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            {step === 'mood' && <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>}
            <Text style={[styles.question, { color: colors.text }]}>{revealedText}</Text>

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
          </Animated.View>
        </ScrollView>
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
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceElevated,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.pill,
      shadowColor: colors.accent,
      shadowOpacity: 0.7,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
    },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: spacing.xxl },
    historyBlock: { marginBottom: spacing.lg, opacity: 0.5 },
    historyBot: { fontFamily: typography.body.fontFamily, fontSize: 15, lineHeight: 20 },
    answerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm },
    answerChip: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingVertical: 7,
      paddingHorizontal: spacing.md,
    },
    answerChipText: { fontFamily: typography.bodyBold.fontFamily, fontSize: 14 },
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
