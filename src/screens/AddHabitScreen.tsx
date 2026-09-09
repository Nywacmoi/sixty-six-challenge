import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { ROUTINE_TEMPLATES } from '../data/templates';
import { COMMON_HABITS } from '../data/commonHabits';
import { useConfirm } from '../context/ConfirmContext';
import { useTopInset } from '../hooks/useTopInset';
import { scrollFocusedIntoView } from '../utils/scrollFocusedIntoView';

const ICONS = [
  'flame', 'fitness', 'walk', 'barbell', 'bicycle', 'leaf', 'nutrition', 'water', 'restaurant',
  'wine', 'book', 'pencil', 'color-palette', 'musical-notes', 'laptop', 'bulb',
  'bed', 'moon', 'phone-portrait', 'cash', 'locate', 'accessibility',
];

const ICON_NAMES: Record<string, string> = {
  flame: 'Flamme',
  fitness: 'Fitness',
  walk: 'Marche',
  barbell: 'Haltères',
  bicycle: 'Vélo',
  leaf: 'Feuille',
  nutrition: 'Nutrition',
  water: 'Eau',
  restaurant: 'Repas',
  wine: 'Vin',
  book: 'Livre',
  pencil: 'Crayon',
  'color-palette': 'Palette de couleurs',
  'musical-notes': 'Musique',
  laptop: 'Ordinateur',
  bulb: 'Ampoule',
  bed: 'Lit',
  moon: 'Lune',
  'phone-portrait': 'Téléphone',
  cash: 'Argent',
  locate: 'Cible',
  accessibility: 'Étirement',
};

const COLORS = ['#005FFE', '#3ECF5B', '#FF5A2E', '#FFC542', '#B15AFF', '#FF4D8D', '#2EC4B6'];
const COLOR_NAMES: Record<string, string> = {
  '#005FFE': 'Bleu',
  '#3ECF5B': 'Vert',
  '#FF5A2E': 'Orange',
  '#FFC542': 'Jaune',
  '#B15AFF': 'Violet',
  '#FF4D8D': 'Rose',
  '#2EC4B6': 'Turquoise',
};

export default function AddHabitScreen({ navigation, route }: any) {
  const { addHabit, addHabitsBulk, habits, showToast } = useApp();
  const { notify } = useConfirm();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const [mode, setMode] = useState<'custom' | 'template'>(route?.params?.initialTab === 'template' ? 'template' : 'custom');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [checkedCommon, setCheckedCommon] = useState<Set<string>>(new Set());
  const [showCustomForm, setShowCustomForm] = useState(false);
  const scaleRefs = useRef<Record<string, Animated.Value>>({});

  const getScale = (id: string) => {
    if (!scaleRefs.current[id]) scaleRefs.current[id] = new Animated.Value(1);
    return scaleRefs.current[id];
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await addHabit(name.trim(), icon, color);
    navigation.goBack();
  };

  const existingNames = new Set(habits.map((h) => h.name.trim().toLowerCase()));

  const toggleCommon = (habitName: string) => {
    setCheckedCommon((prev) => {
      const next = new Set(prev);
      if (next.has(habitName)) next.delete(habitName);
      else next.add(habitName);
      return next;
    });
  };

  const handleAddChecked = async () => {
    const toAdd = COMMON_HABITS.filter(
      (h) => checkedCommon.has(h.name) && !existingNames.has(h.name.trim().toLowerCase())
    );
    if (toAdd.length === 0) return;
    await addHabitsBulk(toAdd);
    showToast('checkmark-circle', `${toAdd.length} habitude${toAdd.length > 1 ? 's' : ''} ajoutée${toAdd.length > 1 ? 's' : ''} !`);
    navigation.goBack();
  };

  const handleAddTemplate = async (templateId: string) => {
    if (addedId) return;
    const template = ROUTINE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const toAdd = template.habits.filter((h) => !existingNames.has(h.name.trim().toLowerCase()));
    const skipped = template.habits.length - toAdd.length;

    if (toAdd.length === 0) {
      notify('Déjà ajoutée', 'Toutes les habitudes de cette routine existent déjà.');
      return;
    }

    setAddedId(templateId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const scale = getScale(templateId);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, speed: 30, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();

    await addHabitsBulk(toAdd);

    const message =
      skipped > 0
        ? `${toAdd.length} habitude${toAdd.length > 1 ? 's' : ''} ajoutée${toAdd.length > 1 ? 's' : ''} (${skipped} déjà existante${skipped > 1 ? 's' : ''})`
        : `+${toAdd.length} habitude${toAdd.length > 1 ? 's' : ''} ajoutée${toAdd.length > 1 ? 's' : ''} !`;

    setTimeout(() => {
      showToast(template.emoji, `${template.title} : ${message}`);
      navigation.goBack();
    }, 450);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: topInset + spacing.sm }}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fermer">
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={typography.h1}>Ajouter</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.tabBar}>
          <Pressable style={[styles.tabBtn, mode === 'custom' && styles.tabBtnActive]} onPress={() => setMode('custom')}>
            <Text style={[typography.bodyBold, mode !== 'custom' && { color: colors.textSecondary }]}>Personnalisé</Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, mode === 'template' && styles.tabBtnActive]} onPress={() => setMode('template')}>
            <Text style={[typography.bodyBold, mode !== 'template' && { color: colors.textSecondary }]}>Modèles</Text>
          </Pressable>
        </View>
      </View>

      {mode === 'custom' ? (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
          <Text style={[typography.caption, { marginBottom: spacing.sm }]}>HABITUDES COURANTES</Text>
          <View style={styles.checklist}>
            {COMMON_HABITS.map((h) => {
              const checked = checkedCommon.has(h.name);
              const alreadyAdded = existingNames.has(h.name.trim().toLowerCase());
              return (
                <Pressable
                  key={h.name}
                  onPress={() => !alreadyAdded && toggleCommon(h.name)}
                  disabled={alreadyAdded}
                  style={[styles.checkRow, checked && { borderColor: h.color, backgroundColor: h.color + '14' }, alreadyAdded && { opacity: 0.4 }]}
                >
                  <Ionicons name={h.icon as any} size={18} color={checked ? h.color : colors.textSecondary} />
                  <Text style={[typography.bodyBold, { flex: 1 }]}>{h.name}</Text>
                  {alreadyAdded ? (
                    <Text style={typography.small}>déjà ajoutée</Text>
                  ) : (
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={checked ? h.color : colors.textTertiary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton
            label={`Ajouter${checkedCommon.size > 0 ? ` (${checkedCommon.size})` : ''}`}
            onPress={handleAddChecked}
            disabled={checkedCommon.size === 0}
            style={{ marginTop: spacing.lg }}
          />

          <Pressable onPress={() => setShowCustomForm((v) => !v)} style={styles.customToggle}>
            <Ionicons name={showCustomForm ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textSecondary} />
            <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>Ou créer une habitude personnalisée</Text>
          </Pressable>

          {showCustomForm && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.caption, { marginBottom: spacing.xs }]}>NOM DE L'HABITUDE</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={scrollFocusedIntoView}
                placeholder="ex. Course matinale"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
              />

              <Text style={[typography.caption, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>ICÔNE</Text>
              <View style={styles.grid}>
                {ICONS.map((i, idx) => (
                  <Pressable
                    key={`${i}-${idx}`}
                    onPress={() => setIcon(i)}
                    style={[styles.iconOption, icon === i && { borderColor: color, backgroundColor: color + '22' }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: icon === i }}
                    accessibilityLabel={`Icône ${ICON_NAMES[i] ?? i}`}
                  >
                    <Ionicons name={i as any} size={22} color={icon === i ? color : colors.textSecondary} />
                  </Pressable>
                ))}
              </View>

              <Text style={[typography.caption, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>COULEUR</Text>
              <View style={styles.grid}>
                {COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorOptionSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: color === c }}
                    accessibilityLabel={`Couleur ${COLOR_NAMES[c] ?? c}`}
                  />
                ))}
              </View>

              <PrimaryButton label="Créer l'habitude" onPress={handleCreate} disabled={!name.trim()} style={{ marginTop: spacing.xl }} />
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
          <Text style={[typography.caption, { marginBottom: spacing.md }]}>
            Ajoute plusieurs habitudes d'un coup avec ces routines prêtes à l'emploi.
          </Text>
          {ROUTINE_TEMPLATES.map((template) => {
            const isAdded = addedId === template.id;
            return (
              <Animated.View
                key={template.id}
                style={[styles.templateCard, { transform: [{ scale: getScale(template.id) }] }, isAdded && styles.templateCardAdded]}
              >
                <View style={styles.templateHeader}>
                  <View style={styles.templateEmoji}>
                    <Ionicons name={template.emoji as any} size={26} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{template.title}</Text>
                    <Text style={typography.caption}>{template.description}</Text>
                  </View>
                </View>
                <View style={styles.chipsRow}>
                  {template.habits.map((h) => (
                    <View key={h.name} style={[styles.chip, { backgroundColor: h.color + '1F' }]}>
                      <Ionicons name={h.icon as any} size={14} color={h.color} />
                      <Text style={[typography.small, { color: colors.text }]}>{h.name}</Text>
                    </View>
                  ))}
                </View>
                {template.program && (
                  <Pressable
                    onPress={() => navigation.navigate('Program', { templateId: template.id })}
                    style={styles.programLink}
                  >
                    <Ionicons name="calendar-outline" size={15} color={colors.accent} />
                    <Text style={[typography.bodyBold, { color: colors.accent }]}>Voir le programme</Text>
                    <Ionicons name="chevron-forward" size={15} color={colors.accent} />
                  </Pressable>
                )}
                <Pressable
                  onPress={() => handleAddTemplate(template.id)}
                  disabled={!!addedId}
                  style={[styles.addTemplateBtn, isAdded && { backgroundColor: colors.success }]}
                >
                  {isAdded ? (
                    <View style={styles.addedRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Ajouté</Text>
                    </View>
                  ) : (
                    <Text style={typography.bodyBold}>{`Ajouter cette routine (+${template.habits.length})`}</Text>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      padding: 4,
      marginTop: spacing.md,
    },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
    tabBtnActive: { backgroundColor: colors.surfaceElevated },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      color: colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    checklist: { gap: spacing.sm },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    customToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.xl,
      alignSelf: 'flex-start',
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    iconOption: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    colorOption: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: colors.text,
    },
    templateCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    templateCardAdded: {
      borderWidth: 1.5,
      borderColor: colors.success,
    },
    templateHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    templateEmoji: { width: 32, alignItems: 'center' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: radius.pill,
    },
    programLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: spacing.md,
      alignSelf: 'flex-start',
    },
    addTemplateBtn: {
      marginTop: spacing.md,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  });
}
