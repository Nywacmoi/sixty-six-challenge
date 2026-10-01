import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { useTrends } from '../hooks/useTrends';
import { todayKey, dailyIndex } from '../utils/date';
import { COMMON_HABITS } from '../data/commonHabits';
import { starterRoutine } from '../data/goals';
import { getHabitCategories } from '../utils/habitCategories';
import { checkInNudge } from '../utils/trends';
import { PrimaryButton } from './PrimaryButton';
import { AppIcon } from './AppIcon';
import { AmbientBackdrop } from './AmbientBackdrop';

// Every answer is a level on an energy scale and a colour on it, cold to
// warm. The colour does three jobs: it tints the card, it becomes the glow
// the whole screen shifts to once picked, and it fills that question's
// segment in the progress bar — so by the last step the bar is a small
// record of how the morning started.
type Option = { icon: string; label: string; color: string; level: 1 | 2 | 3 | 4 };

const MOODS: Option[] = [
  { icon: 'bed', label: 'Fatigué', color: '#6C8CFF', level: 1 },
  { icon: 'neutral', label: 'Moyen', color: '#2EC4B6', level: 2 },
  { icon: 'happy', label: 'Bien', color: '#3ECF5B', level: 3 },
  { icon: 'flame', label: 'En feu', color: '#FF5A2E', level: 4 },
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

const SLEEPS: Option[] = [
  { icon: 'sad', label: 'Mal dormi', color: '#B15AFF', level: 1 },
  { icon: 'neutral', label: 'Sommeil moyen', color: '#6C8CFF', level: 2 },
  { icon: 'happy', label: 'Bien dormi', color: '#2EC4B6', level: 3 },
  { icon: 'star', label: 'Nuit parfaite', color: '#FFC542', level: 4 },
];

const colorOf = (options: Option[], label: string | null) => options.find((o) => o.label === label)?.color ?? null;

// Said by the clock, not picked from a pool: the old list included a
// "prêt(e) pour aujourd'hui" line that stacked a second question on top of
// the real one, and with no name given it greeted people as "Toi".
function greetingFor(name: string | null) {
  const hour = new Date().getHours();
  const hello = hour >= 5 && hour < 12 ? 'Bonjour' : hour >= 12 && hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  return name ? `${hello} ${name}` : hello;
}

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

type HistoryEntry = { bot: string; answer: string; color: string };

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

// Big cards rather than chips, each carrying its colour and its place on the
// scale: four short bars along the bottom, filled up to the option's level,
// so the four cards read as one gauge from flat to full. Content sits on
// the left edge like the rest of the app's rows; the centred icon-in-a-
// circle version looked like a settings grid.
//
// A picked card fills with its colour for the instant before the step
// changes, so the choice registers as something that happened rather than
// as the screen simply moving on.
function OptionCard({ option, onPress, index }: { option: Option; onPress: () => void; index: number }) {
  const { colors } = useTheme();
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const [picked, setPicked] = useState(false);
  const { icon, label, color, level } = option;

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
        onPress={() => {
          setPicked(true);
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        onPressIn={() => Animated.spring(press, { toValue: 0.95, useNativeDriver: true, friction: 7, tension: 200 }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 1, useNativeDriver: true, friction: 5, tension: 150 }).start()}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          paddingTop: spacing.md + 2,
          paddingBottom: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: picked ? color : color + '38',
          backgroundColor: picked ? color + '2A' : colors.surface,
        }}
      >
        <AppIcon name={icon} size={30} color={color} />
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: spacing.md }}>{label}</Text>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: spacing.sm + 2 }}>
          {[1, 2, 3, 4].map((n) => (
            <View
              key={n}
              style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: n <= level ? color : colors.surfaceElevated }}
            />
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// The screen's glow, in the colour of the latest answer. A change of colour
// cross-fades a new layer in over the old one rather than recolouring in
// place, which would snap; at most two layers are alive at any time.
function MoodGlow({ color }: { color: string }) {
  const [layers, setLayers] = useState([{ id: 0, color }]);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const top = layers[layers.length - 1];
    if (color === top.color) return;
    const next = { id: top.id + 1, color };
    fade.setValue(0);
    setLayers([top, next]);
    Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setLayers([next]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  return (
    <>
      {layers.map((layer, i) => (
        <Animated.View
          key={layer.id}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: layers.length > 1 && i === layers.length - 1 ? fade : 1 }]}
        >
          <AmbientBackdrop color={layer.color} />
        </Animated.View>
      ))}
    </>
  );
}

// Each past exchange gets its own small entrance instead of snapping into
// place — mirrors OptionCard's staggered-in treatment so the whole flow
// shares one motion language instead of mixing animated and static blocks.
function HistoryItem({ bot, answer, color, styles, colors }: HistoryEntry & { styles: ReturnType<typeof createStyles>; colors: ThemeColors }) {
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
        <View style={[styles.answerChip, { backgroundColor: color + '1F', borderColor: color + '66' }]}>
          <Text style={[styles.answerChipText, { color }]}>{answer}</Text>
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
      {/* Same round check as the habit rows on Aujourd'hui, and a ticked
          suggestion takes on its habit's colour the way a ticked habit does
          there — the square system checkboxes were the one thing on this
          screen that came from somewhere else. */}
      <Pressable
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: active }}
        style={[styles.row, { borderColor: active ? habit.color : colors.border, backgroundColor: active ? habit.color + '1A' : colors.surface }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: habit.color + '26' }]}>
          <AppIcon name={habit.icon} size={18} color={habit.color} />
        </View>
        <Text style={[active ? typography.bodyBold : typography.body, { flex: 1 }]}>{habit.name}</Text>
        <View style={[styles.check, active && { backgroundColor: habit.color, borderColor: habit.color }]}>
          {active && <Ionicons name="checkmark" size={16} color={colors.background} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function MorningCheckIn() {
  const { profile, habits, currentDay, addHabitsBulk, updateProfile, logMetric } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const trends = useTrends();
  const [step, setStep] = useState<Step>('mood');
  // Answered questions stay on screen instead of being replaced — each past
  // exchange dims into scrollback (bot line + the person's own answer as a
  // chat-style chip) while the live one stays bright below, the same
  // conversational pattern as the reference: a running thread, not a
  // sequence of screens that wipe each other.
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [sleep, setSleep] = useState<string | null>(null);
  // Someone with no habits yet has just answered the onboarding question —
  // the check-in is the very next screen. Their routine comes pre-ticked, so
  // starting is one tap; anything they don't want, they untick.
  const starter = habits.some((h) => !h.archived) ? null : starterRoutine(profile.goal);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(starter?.habits.map((h) => h.name) ?? []));
  const fadeIn = useRef(new Animated.Value(0)).current;
  const blockIn = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
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
  const suggestions = starter ? starter.habits : [...related, ...unrelated].slice(0, SUGGESTION_COUNT);

  const named = profile.name?.trim() && profile.name.trim() !== 'Toi' ? firstName : null;
  const greeting = greetingFor(named);
  const dateLine = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  const moodColor = colorOf(MOODS, mood);
  const sleepColor = colorOf(SLEEPS, sleep);
  const glowColor = sleepColor ?? moodColor ?? colors.accent;
  // Answered questions are filled in their answer's colour, the current one
  // is marked, the rest wait.
  const segments = STEP_ORDER.map((s, i) => {
    const answered = i === 0 ? moodColor : i === 1 ? sleepColor : null;
    if (answered && STEP_ORDER.indexOf(step) > i) return answered;
    return s === step ? colors.text + '59' : colors.surfaceElevated;
  });

  const moodQuestion = MOOD_QUESTIONS[dailyIndex(MOOD_QUESTIONS.length, 'checkin:mood-q')];
  const sleepQuestion = SLEEP_QUESTIONS[dailyIndex(SLEEP_QUESTIONS.length, 'checkin:sleep-q')];
  const routineQuestion = ROUTINE_QUESTIONS[dailyIndex(ROUTINE_QUESTIONS.length, 'checkin:routine-q')](currentDay);

  const moodReactionPool = MOOD_REACTIONS[mood ?? ''] ?? [''];
  const moodReaction = moodReactionPool[dailyIndex(moodReactionPool.length, `checkin:mood-r:${mood ?? ''}`)];
  const sleepReactionPool = SLEEP_REACTIONS[sleep ?? ''] ?? [''];
  const sleepReaction = sleepReactionPool[dailyIndex(sleepReactionPool.length, `checkin:sleep-r:${sleep ?? ''}`)];

  // When the person's own history has something to say about this morning
  // — a rough night, or the weekday they usually lose — it replaces the
  // stock reaction: their number is worth more than a generic line.
  const nudge = checkInNudge(trends, SLEEPS.find((s) => s.label === sleep)?.level ?? null, todayKey());

  const currentBotText =
    step === 'mood'
      ? moodQuestion
      : step === 'sleep'
        ? `${moodReaction} ${sleepQuestion}`
        : `${nudge ?? sleepReaction} ${starter ? starter.lead : routineQuestion}`;
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

  // Each answer is also kept as its level on the scale, one per morning —
  // re-answering overwrites — so Progression can line it up against how
  // the day went. Saved on the tap, not at the end: someone who answers
  // and closes the app before the routine step still told us.
  const pickMood = (label: string) => {
    const level = MOODS.find((m) => m.label === label)?.level;
    if (level) logMetric('checkin:mood', level);
    transition('sleep', () => {
      setHistory((h) => [...h, { bot: moodQuestion, answer: label, color: colorOf(MOODS, label) ?? colors.accent }]);
      setMood(label);
    });
  };

  const pickSleep = (label: string) => {
    const level = SLEEPS.find((s) => s.label === label)?.level;
    if (level) logMetric('checkin:sleep', level);
    transition('routine', () => {
      setHistory((h) => [...h, { bot: `${moodReaction} ${sleepQuestion}`, answer: label, color: colorOf(SLEEPS, label) ?? colors.accent }]);
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
      <MoodGlow color={glowColor} />
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
          <View style={styles.segments}>
            {segments.map((c, i) => (
              <View key={STEP_ORDER[i]} style={[styles.segment, { backgroundColor: c }]} />
            ))}
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
            <HistoryItem key={i} bot={entry.bot} answer={entry.answer} color={entry.color} styles={styles} colors={colors} />
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
            {step === 'mood' && (
              <>
                <Text style={styles.dateLine}>
                  {dateLine}
                  {currentDay >= 1 ? ` · JOUR ${currentDay}` : ''}
                </Text>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
              </>
            )}
            <Text style={[styles.question, { color: colors.text }]}>{revealedText}</Text>

            {step === 'mood' && (
              <View style={styles.moodRow}>
                {MOODS.map((m, i) => (
                  <OptionCard key={m.label} option={m} onPress={() => pickMood(m.label)} index={i} />
                ))}
              </View>
            )}

            {step === 'sleep' && (
              <View style={styles.moodRow}>
                {SLEEPS.map((s, i) => (
                  <OptionCard key={s.label} option={s} onPress={() => pickSleep(s.label)} index={i} />
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
    segments: { flex: 1, flexDirection: 'row', gap: 6 },
    segment: { flex: 1, height: 4, borderRadius: radius.pill },
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
    dateLine: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.8, color: colors.textTertiary, marginBottom: spacing.md },
    greeting: { fontFamily: fonts.medium, fontSize: 17, marginBottom: spacing.xs },
    // Regular weight, not the app's bold display face — the reference's
    // questions read as light, almost conversational, and a heavy weight
    // here fought that "someone typing to you" feel. Larger and tighter
    // than before, so the question holds the screen on its own.
    question: { fontFamily: fonts.regular, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
    moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
    list: { marginTop: spacing.xl, gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: spacing.md,
    },
    check: {
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrap: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  });
}
