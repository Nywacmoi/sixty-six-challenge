import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { todayKey, dailyIndex } from '../utils/date';
import { COMMON_HABITS } from '../data/commonHabits';
import { getHabitCategories } from '../utils/habitCategories';
import { PrimaryButton } from './PrimaryButton';
import { AppIcon } from './AppIcon';

const GREETINGS = ['Salut {name}', 'Hey {name} !', 'Bonjour {name}', '{name}, prêt(e) pour aujourd\'hui ?'];

const MOODS = [
  { icon: 'bed', label: 'Fatigué' },
  { icon: 'neutral', label: 'Moyen' },
  { icon: 'happy', label: 'Bien' },
  { icon: 'flame', label: 'En feu' },
];

// Several phrasings per question/reaction, picked once a day via dailyIndex
// (utils/date.ts — stable all day, different tomorrow) so the check-in
// reads like an actual conversation instead of the same four sentences on
// repeat every single morning.
const MOOD_QUESTIONS = [
  "Comment tu te sens aujourd'hui ?",
  'Ça va comment, ce matin ?',
  'Quelle énergie pour cette journée ?',
  'Et toi, tu démarres comment ?',
];

const MOOD_REACTIONS: Record<string, string[]> = {
  Fatigué: [
    'Pas de souci, on y va doucement — un petit pas suffit à garder la série.',
    'Ok, journée tranquille alors. L’essentiel, c’est de ne pas casser la série.',
    'Compris, on garde ça simple aujourd’hui.',
  ],
  Moyen: [
    'Ça arrive à tout le monde, une habitude cochée et ça ira déjà mieux.',
    'Journée normale, ça se travaille — une case cochée et c’est déjà une victoire.',
    'Pas grave, on avance quand même.',
  ],
  Bien: [
    "Top, autant en profiter aujourd'hui.",
    'Belle énergie — parfait pour avancer sur le défi.',
    'Content de l’entendre, ça va aider aujourd’hui.',
  ],
  'En feu': [
    "J'adore cette énergie. Direction le prochain jour du défi.",
    'Là on parle ! Autant en profiter à fond aujourd’hui.',
    'Cette énergie-là, faut la garder toute la journée.',
  ],
};

const SLEEPS = [
  { icon: 'sad', label: 'Mal dormi' },
  { icon: 'neutral', label: 'Sommeil moyen' },
  { icon: 'happy', label: 'Bien dormi' },
  { icon: 'star', label: 'Nuit parfaite' },
];

const SLEEP_QUESTIONS = [
  'Et cette nuit, tu as bien dormi ?',
  'Ta nuit, elle était comment ?',
  'Côté sommeil, ça a donné quoi ?',
  'Tu as récupéré cette nuit ?',
];

const SLEEP_REACTIONS: Record<string, string[]> = {
  'Mal dormi': [
    'Pense à toi ce soir — une bonne nuit, ça change tout.',
    'Note-le, et essaie de te coucher un peu plus tôt ce soir.',
    'Ça se rattrape ce soir — une bonne nuit et il n’y paraîtra plus.',
  ],
  'Sommeil moyen': [
    'Correct, on fait avec !',
    'Ni top ni terrible — de quoi tenir la journée.',
    'Ça passe, on continue sur cette lancée.',
  ],
  'Bien dormi': [
    'Parfait pour attaquer la journée.',
    'Bonne base pour aujourd’hui.',
    'Ça se sent, tu pars sur de bonnes bases.',
  ],
  'Nuit parfaite': [
    "Un vrai carburant pour aujourd'hui.",
    'Avec ça, rien ne peut t’arrêter aujourd’hui.',
    'Nuit parfaite, journée parfaite — à toi de jouer.',
  ],
};

// {day} is filled in with the current challenge day at render time.
const ROUTINE_QUESTIONS = [
  (day: number) => `Jour ${day} sur 99 — une routine à ajouter aujourd'hui ?`,
  (day: number) => `On est au jour ${day}. Une nouvelle habitude à tenter ?`,
  (day: number) => `Jour ${day} sur 99 — envie d’ajouter quelque chose à ta journée ?`,
  (day: number) => `Jour ${day}/99 — un petit ajout à ta routine ?`,
];

// A few common habits not already on the list — offered as "want to add one
// today?" rather than the full catalogue, to keep this quick.
const SUGGESTION_COUNT = 4;

type Step = 'mood' | 'sleep' | 'routine';
const STEP_ORDER: Step[] = ['mood', 'sleep', 'routine'];

type HistoryEntry = { bot: string; answer: string };

// Reveals `text` a few characters at a time — the "AI is typing" feel from
// the reference, reinterpreted with this app's own colors instead of a
// fixed dark palette (kept theme-aware, not copied verbatim). Speed adapts
// to length so a long reaction+question sentence still lands in under a
// second instead of dragging on character by character.
function useTypewriter(text: string) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    let i = 0;
    const speed = Math.max(10, Math.min(22, Math.round(900 / Math.max(text.length, 1))));
    const interval = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return shown;
}

// Big icon-card options instead of small pill chips — the reference gives
// each choice real visual weight (large icon, generous card) rather than a
// row of compact buttons, and staggers them in one at a time instead of
// popping in together.
function OptionCard({ icon, label, onPress, index }: { icon: string; label: string; onPress: () => void; index: number }) {
  const { colors } = useTheme();
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 340, delay: index * 70, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: '47%',
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          { scale: Animated.multiply(enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }), press) },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(press, { toValue: 0.95, useNativeDriver: true, friction: 7, tension: 200 }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 1, useNativeDriver: true, friction: 5, tension: 150 }).start()}
        style={{
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.pill,
            backgroundColor: colors.accent + '14',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name={icon} size={26} color={colors.accent} />
        </View>
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: colors.text }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Each past exchange gets its own small entrance instead of snapping into
// place — mirrors OptionCard's staggered-in treatment so the whole flow
// shares one motion language instead of mixing animated and static blocks.
function HistoryItem({ bot, answer, styles, colors }: HistoryEntry & { styles: ReturnType<typeof createStyles>; colors: ThemeColors }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.historyBlock,
        {
          opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        },
      ]}
    >
      <Text style={[styles.historyBot, { color: colors.textTertiary }]}>{bot}</Text>
      <View style={styles.answerRow}>
        <View style={[styles.answerChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.answerChipText, { color: colors.text }]}>{answer}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Same staggered fade-in as the mood/sleep option cards, applied to the
// routine suggestion rows so the whole check-in shares one motion language.
function RoutineRow({
  habit,
  active,
  onPress,
  index,
  styles,
}: {
  habit: { name: string; icon: string; color: string };
  active: boolean;
  onPress: () => void;
  index: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const { colors, typography } = useTheme();
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 280, delay: index * 60, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View
      style={{ opacity: enter, transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}
    >
      <Pressable onPress={onPress} style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: habit.color + '26' }]}>
          <AppIcon name={habit.icon} size={18} color={habit.color} />
        </View>
        <Text style={[typography.body, { flex: 1 }]}>{habit.name}</Text>
        <Ionicons name={active ? 'checkbox' : 'square-outline'} size={22} color={active ? colors.accent : colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
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

  const moodQuestion = MOOD_QUESTIONS[dailyIndex(MOOD_QUESTIONS.length, 'checkin:mood-q')];
  const sleepQuestion = SLEEP_QUESTIONS[dailyIndex(SLEEP_QUESTIONS.length, 'checkin:sleep-q')];
  const routineQuestion = ROUTINE_QUESTIONS[dailyIndex(ROUTINE_QUESTIONS.length, 'checkin:routine-q')](currentDay);

  const moodReactionPool = MOOD_REACTIONS[mood ?? ''] ?? [''];
  const moodReaction = moodReactionPool[dailyIndex(moodReactionPool.length, `checkin:mood-r:${mood ?? ''}`)];
  const sleepReactionPool = SLEEP_REACTIONS[sleep ?? ''] ?? [''];
  const sleepReaction = sleepReactionPool[dailyIndex(sleepReactionPool.length, `checkin:sleep-r:${sleep ?? ''}`)];

  const currentBotText =
    step === 'mood'
      ? moodQuestion
      : step === 'sleep'
        ? `${moodReaction} ${sleepQuestion}`
        : `${sleepReaction} ${routineQuestion}`;
  const revealedText = useTypewriter(currentBotText);

  const finish = async () => {
    await updateProfile({ lastCheckInDate: todayKey() });
  };

  // Fade the current question+options out, then swap state and let the
  // [step] effect below fade the next block in — an explicit Animated
  // crossfade instead of LayoutAnimation, which react-native-web silently
  // no-ops (this app also ships as a web PWA, where the old code produced
  // an instant jump-cut between steps rather than any transition at all).
  const transition = (nextStep: Step | null, apply: () => void) => {
    Animated.timing(blockIn, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      apply();
      if (nextStep) setStep(nextStep);
    });
  };

  const pickMood = (label: string) => {
    transition('sleep', () => {
      setHistory((h) => [...h, { bot: moodQuestion, answer: label }]);
      setMood(label);
    });
  };

  const pickSleep = (label: string) => {
    transition('routine', () => {
      setHistory((h) => [...h, { bot: `${moodReaction} ${sleepQuestion}`, answer: label }]);
      setSleep(label);
    });
  };

  // One step back at a time, like the reference's back chevron — pop the
  // last exchange out of the scrollback and clear the answer it held so the
  // chips for that step are re-selectable.
  const goBack = () => {
    if (step === 'mood') return;
    const prevStep = step === 'sleep' ? 'mood' : 'sleep';
    transition(prevStep, () => {
      setHistory((h) => h.slice(0, -1));
      if (step === 'sleep') setMood(null);
      else if (step === 'routine') setSleep(null);
    });
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
            <HistoryItem key={i} bot={entry.bot} answer={entry.answer} styles={styles} colors={colors} />
          ))}

          <Animated.View
            style={{
              opacity: blockIn,
              transform: [
                { translateY: blockIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                { scale: blockIn.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
              ],
            }}
          >
            {step === 'mood' && <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>}
            <Text style={[styles.question, { color: colors.text }]}>{revealedText}</Text>

            {step === 'mood' && (
              <View style={styles.moodRow}>
                {MOODS.map((m, i) => (
                  <OptionCard key={m.label} icon={m.icon} label={m.label} onPress={() => pickMood(m.label)} index={i} />
                ))}
              </View>
            )}

            {step === 'sleep' && (
              <View style={styles.moodRow}>
                {SLEEPS.map((s, i) => (
                  <OptionCard key={s.label} icon={s.icon} label={s.label} onPress={() => pickSleep(s.label)} index={i} />
                ))}
              </View>
            )}

            {step === 'routine' && (
              <>
                {suggestions.length > 0 ? (
                  <View style={styles.list}>
                    {suggestions.map((h, i) => (
                      <RoutineRow key={h.name} habit={h} active={checked.has(h.name)} onPress={() => toggle(h.name)} index={i} styles={styles} />
                    ))}
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
    historyBlock: { marginBottom: spacing.lg },
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
    // Regular weight, not the app's bold display face — the reference's
    // questions read as light, almost conversational, and a heavy weight
    // here fought that "someone typing to you" feel.
    question: { fontFamily: fonts.regular, fontSize: 26, lineHeight: 32 },
    moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
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
