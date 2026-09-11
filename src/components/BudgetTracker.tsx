import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { Habit } from '../types';
import { todayKey } from '../utils/date';
import { scrollFocusedIntoView } from '../utils/scrollFocusedIntoView';

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatEuros(n: number) {
  return `${n.toFixed(2).replace('.', ',')} €`;
}

export function BudgetTracker({ habit }: { habit: Habit }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const { logMetric, getMetricHistory, updateHabit } = useApp();
  const metricKey = `budget:${habit.id}`;
  const [editingToday, setEditingToday] = useState(false);
  const [todayDraft, setTodayDraft] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(habit.monthlyBudget != null ? String(habit.monthlyBudget) : '');

  const now = new Date();
  const monthPrefix = todayKey().slice(0, 7);
  const history = getMetricHistory(metricKey);
  const monthEntries = history.filter((m) => m.date.startsWith(monthPrefix));
  const todayEntry = monthEntries.find((m) => m.date === todayKey());

  const totalSpent = monthEntries.reduce((sum, m) => sum + m.value, 0);
  const dayOfMonth = now.getDate();
  const totalDays = daysInMonth(now);
  const dailyAverage = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projected = dailyAverage * totalDays;
  const goal = habit.monthlyBudget;
  const overBudget = goal != null && projected > goal;

  const startEditingToday = () => {
    setTodayDraft(todayEntry ? String(todayEntry.value) : '');
    setEditingToday(true);
  };

  const saveToday = async () => {
    const parsed = parseFloat(todayDraft.replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed >= 0) {
      await logMetric(metricKey, parsed);
    }
    setEditingToday(false);
  };

  const saveGoal = async () => {
    const parsed = parseFloat(goalDraft.replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed > 0) {
      await updateHabit(habit.id, { monthlyBudget: parsed });
    }
    setEditingGoal(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={typography.caption}>DÉPENSÉ CE MOIS-CI</Text>
        <Pressable onPress={() => setEditingGoal((v) => !v)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Modifier le budget mensuel">
          <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      {editingGoal && (
        <View style={styles.editRow}>
          <TextInput
            value={goalDraft}
            onChangeText={setGoalDraft}
            onFocus={scrollFocusedIntoView}
            keyboardType="decimal-pad"
            placeholder="ex. 400"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoFocus
            onSubmitEditing={saveGoal}
          />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>€ / mois</Text>
          <Pressable onPress={saveGoal} style={styles.saveBtn} accessibilityRole="button" accessibilityLabel="Enregistrer le budget">
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      <Text style={[styles.bigNumber, { color: colors.text }]}>{formatEuros(totalSpent)}</Text>
      {goal != null && (
        <View style={styles.goalBarTrack}>
          <View
            style={[
              styles.goalBarFill,
              { width: `${Math.min(100, (totalSpent / goal) * 100)}%`, backgroundColor: overBudget ? colors.danger : colors.accent },
            ]}
          />
        </View>
      )}
      {goal != null && (
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          Budget : {formatEuros(goal)} / mois
        </Text>
      )}

      <View style={styles.divider} />

      <View style={styles.forecastRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.small, { color: colors.textTertiary }]}>MOYENNE / JOUR</Text>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{formatEuros(dailyAverage)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.small, { color: colors.textTertiary }]}>PRÉVISION FIN DE MOIS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={[typography.bodyBold, { color: goal != null ? (overBudget ? colors.danger : colors.success) : colors.text }]}>
              {formatEuros(projected)}
            </Text>
            {goal != null && (
              <Ionicons name={overBudget ? 'trending-up' : 'checkmark-circle'} size={14} color={overBudget ? colors.danger : colors.success} />
            )}
          </View>
        </View>
      </View>
      {goal != null && (
        <Text style={[typography.caption, { color: overBudget ? colors.danger : colors.success, marginTop: spacing.xs }]}>
          {overBudget
            ? `À ce rythme, ${formatEuros(projected - goal)} au-dessus du budget.`
            : "À ce rythme, tu restes dans ton budget."}
        </Text>
      )}

      <View style={styles.divider} />

      {editingToday ? (
        <View style={styles.editRow}>
          <TextInput
            value={todayDraft}
            onChangeText={setTodayDraft}
            onFocus={scrollFocusedIntoView}
            keyboardType="decimal-pad"
            placeholder="ex. 23.50"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoFocus
            onSubmitEditing={saveToday}
          />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>€ aujourd'hui</Text>
          <Pressable onPress={saveToday} style={styles.saveBtn} accessibilityRole="button" accessibilityLabel="Enregistrer la dépense du jour">
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={startEditingToday} style={styles.todayRow}>
          <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
          <Text style={[typography.bodyBold, { color: colors.accent, flex: 1 }]}>
            {todayEntry ? "Modifier la dépense d'aujourd'hui" : "Noter la dépense d'aujourd'hui"}
          </Text>
          {todayEntry && <Text style={[typography.bodyBold, { color: colors.text }]}>{formatEuros(todayEntry.value)}</Text>}
        </Pressable>
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
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bigNumber: { fontFamily: typography.display.fontFamily, fontSize: 32, marginTop: 4 },
    goalBarTrack: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceElevated,
      overflow: 'hidden',
      marginTop: spacing.sm,
    },
    goalBarFill: { height: '100%', borderRadius: radius.pill },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
    forecastRow: { flexDirection: 'row' },
    todayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.xs },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
      color: colors.text,
      fontSize: 16,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
