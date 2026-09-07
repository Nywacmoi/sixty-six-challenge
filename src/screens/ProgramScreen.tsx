import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { ROUTINE_TEMPLATES } from '../data/templates';
import { useConfirm } from '../context/ConfirmContext';
import { useTopInset } from '../hooks/useTopInset';

export default function ProgramScreen({ navigation, route }: any) {
  const { templateId } = route.params;
  const template = ROUTINE_TEMPLATES.find((t) => t.id === templateId);
  const { addHabitsBulk, habits, showToast } = useApp();
  const { notify } = useConfirm();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();

  if (!template || !template.program) return null;
  const { program } = template;

  const handleAdd = async () => {
    const existingNames = new Set(habits.map((h) => h.name.trim().toLowerCase()));
    const toAdd = template.habits.filter((h) => !existingNames.has(h.name.trim().toLowerCase()));
    if (toAdd.length === 0) {
      notify('Déjà ajoutée', 'Toutes les habitudes de cette routine existent déjà.');
      return;
    }
    await addHabitsBulk(toAdd);
    showToast(template.emoji, `${template.title} ajoutée — suis le programme ci-dessus !`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={[styles.headerRow, { paddingTop: topInset + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Text style={styles.emoji}>{template.emoji}</Text>
        <Text style={typography.display}>{template.title}</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>{program.subtitle}</Text>

        {program.weeks.map((week) => (
          <View key={week.label} style={styles.weekCard}>
            <Text style={[typography.caption, { color: colors.accent }]}>{week.label.toUpperCase()}</Text>
            <Text style={[typography.h2, { marginTop: spacing.xs }]}>{week.focus}</Text>
            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              {week.actions.map((action) => (
                <View key={action} style={styles.actionRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} style={{ marginTop: 1 }} />
                  <Text style={[typography.body, { flex: 1 }]}>{action}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <PrimaryButton
          label={`Ajouter cette routine (+${template.habits.length})`}
          onPress={handleAdd}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
    emoji: { fontSize: 40, marginBottom: spacing.xs },
    weekCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    actionRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  });
}
