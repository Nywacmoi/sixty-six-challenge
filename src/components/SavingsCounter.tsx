import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { Habit } from '../types';
import { PrimaryButton } from './PrimaryButton';
import { scrollFocusedIntoView } from '../utils/scrollFocusedIntoView';

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, '0')}`;
}

export function SavingsCounter({
  habit,
  days,
  unit,
  question,
}: {
  habit: Habit;
  days: number;
  unit: 'euros' | 'minutes';
  question: string;
}) {
  const { updateHabit } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const [editing, setEditing] = useState(habit.savedPerDay == null);
  const [draft, setDraft] = useState(habit.savedPerDay != null ? String(habit.savedPerDay) : '');

  const save = async () => {
    const value = parseFloat(draft.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) return;
    await updateHabit(habit.id, { savedPerDay: value });
    setEditing(false);
  };

  const clearedDays = Math.max(0, days);
  const total = (habit.savedPerDay ?? 0) * clearedDays;
  const formattedTotal = unit === 'euros' ? `${total.toFixed(2).replace('.', ',')} €` : formatMinutes(total);
  const label = unit === 'euros' ? 'ARGENT ÉCONOMISÉ' : 'TEMPS RÉCUPÉRÉ';

  if (editing) {
    return (
      <View style={styles.card}>
        <Text style={typography.body}>{question}</Text>
        <View style={styles.editRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={scrollFocusedIntoView}
            placeholder={unit === 'euros' ? 'ex. 8' : 'ex. 45'}
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <Text style={typography.caption}>{unit === 'euros' ? '€ / jour' : 'min / jour'}</Text>
        </View>
        <PrimaryButton label="Valider" onPress={save} disabled={!draft.trim()} style={{ marginTop: spacing.sm }} />
      </View>
    );
  }

  return (
    <Pressable style={styles.card} onPress={() => setEditing(true)}>
      <View style={styles.headerRow}>
        <Text style={typography.caption}>{label}</Text>
        <Ionicons name="pencil" size={13} color={colors.textTertiary} />
      </View>
      <Text style={[styles.bigNumber, { color: colors.accent }]}>{formattedTotal}</Text>
      <Text style={typography.caption}>
        en {clearedDays} jour{clearedDays > 1 ? 's' : ''} · {habit.savedPerDay}
        {unit === 'euros' ? ' €' : ' min'} / jour
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bigNumber: { fontFamily: typography.display.fontFamily, fontSize: 32, marginTop: 4, marginBottom: 4 },
    editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
