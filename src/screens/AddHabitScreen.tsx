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
import { useConfirm } from '../context/ConfirmContext';
import { useTopInset } from '../hooks/useTopInset';

const EMOJIS = [
  '🔥', '💪', '🏃', '🏋️', '🚴', '🧘', '🚶', '🥗', '💧', '🍎',
  '🥦', '🚭', '🍷', '📖', '✍️', '🎨', '🎸', '🎧', '💻', '🧠',
  '🛌', '🌙', '☀️', '🧴', '🧹', '🐶', '🙏', '📵', '💊', '🩺',
  '🚿', '💰', '📷', '🗓️', '🎯', '🌱', '🧩', '🥶', '☕', '🎮',
];

const COLORS = ['#FF5A2E', '#3ECF5B', '#4E9BFF', '#FFC542', '#B15AFF', '#FF4D8D', '#2EC4B6'];

export default function AddHabitScreen({ navigation, route }: any) {
  const { addHabit, addHabitsBulk, habits, showToast } = useApp();
  const { notify } = useConfirm();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const [mode, setMode] = useState<'custom' | 'template'>(route?.params?.initialTab === 'template' ? 'template' : 'custom');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [addedId, setAddedId] = useState<string | null>(null);
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
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
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
          <Text style={[typography.caption, { marginBottom: spacing.xs }]}>NOM DE L'HABITUDE</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ex. Course matinale"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <Text style={[typography.caption, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>ICÔNE</Text>
          <View style={styles.grid}>
            {EMOJIS.map((e, i) => (
              <Pressable
                key={`${e}-${i}`}
                onPress={() => setIcon(e)}
                style={[styles.iconOption, icon === e && { borderColor: color, backgroundColor: color + '22' }]}
              >
                <Text style={styles.emojiOption}>{e}</Text>
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
              />
            ))}
          </View>

          <PrimaryButton label="Créer l'habitude" onPress={handleCreate} disabled={!name.trim()} style={{ marginTop: spacing.xl }} />
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
                  <Text style={styles.templateEmoji}>{template.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{template.title}</Text>
                    <Text style={typography.caption}>{template.description}</Text>
                  </View>
                </View>
                <View style={styles.chipsRow}>
                  {template.habits.map((h) => (
                    <View key={h.name} style={[styles.chip, { backgroundColor: h.color + '1F' }]}>
                      <Text style={styles.chipEmoji}>{h.icon}</Text>
                      <Text style={[typography.small, { color: colors.text }]}>{h.name}</Text>
                    </View>
                  ))}
                </View>
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
    emojiOption: { fontSize: 22 },
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
    templateEmoji: { fontSize: 28 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: radius.pill,
    },
    chipEmoji: { fontSize: 14 },
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
