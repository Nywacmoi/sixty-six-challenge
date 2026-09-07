import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, TOTAL_DAYS, ThemeColors, Typography } from '../theme/theme';
import { scheduleDailyReminder, cancelDailyReminder } from '../utils/reminders';
import { useConfirm } from '../context/ConfirmContext';
import { useTopInset } from '../hooks/useTopInset';
import { ProgressBar } from '../components/ProgressBar';

export default function ProfileScreen() {
  const { profile, updateProfile, currentDay, getTotalCompletions, habits, levelInfo } = useApp();
  const { confirmAction, notify } = useConfirm();
  const { colors, typography, mode, toggleTheme } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);

  const saveName = async () => {
    await updateProfile({ name: nameDraft.trim() || 'Toi' });
    setEditingName(false);
  };

  const toggleReminders = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        notify('Notifications désactivées', 'Active les notifications dans les réglages système pour recevoir des rappels.');
        return;
      }
      await scheduleDailyReminder(profile.reminderHour, profile.reminderMinute);
    } else {
      await cancelDailyReminder();
    }
    await updateProfile({ reminderEnabled: value });
  };

  const resetChallenge = () => {
    confirmAction(
      'Redémarrer le défi',
      'Ceci réinitialise ton jour 1. Tes habitudes et ton historique restent intacts.',
      'Redémarrer',
      async () => {
        const { todayKey } = await import('../utils/date');
        await updateProfile({ challengeStartDate: todayKey() });
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: topInset + spacing.sm, paddingBottom: spacing.xxl }}>
        <Text style={typography.display}>Profil</Text>

        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: profile.avatarColor + '33' }]}>
            <Text style={{ color: profile.avatarColor, fontSize: 28, fontFamily: 'Anton_400Regular' }}>{profile.name[0]?.toUpperCase()}</Text>
          </View>
          {editingName ? (
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onSubmitEditing={saveName}
              onBlur={saveName}
              autoFocus
              style={styles.nameInput}
            />
          ) : (
            <Pressable onPress={() => setEditingName(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={typography.h1}>{profile.name}</Text>
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          <Text style={typography.caption}>Jour {currentDay} sur {TOTAL_DAYS}</Text>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={16} color={colors.gold} />
              <Text style={[typography.bodyBold, { color: colors.gold }]}>Niveau {levelInfo.level}</Text>
            </View>
            <Text style={typography.caption}>
              {levelInfo.xpIntoLevel} / {levelInfo.xpForNextLevel} XP
            </Text>
          </View>
          <ProgressBar progress={levelInfo.progress} height={8} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={typography.h1}>{habits.length}</Text>
            <Text style={typography.caption}>Habitudes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.h1}>{getTotalCompletions()}</Text>
            <Text style={typography.caption}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.h1}>🧊 {profile.streakFreezes}</Text>
            <Text style={typography.caption}>Freezes</Text>
          </View>
        </View>

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Réglages</Text>

        <View style={styles.settingRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.text} />
            <Text style={typography.body}>Mode sombre</Text>
          </View>
          <Switch value={mode === 'dark'} onValueChange={toggleTheme} trackColor={{ true: colors.accent }} />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <Text style={typography.body}>Rappels quotidiens</Text>
          </View>
          <Switch value={profile.reminderEnabled} onValueChange={toggleReminders} trackColor={{ true: colors.accent }} />
        </View>

        <Pressable style={styles.settingRow} onPress={resetChallenge}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name="refresh-outline" size={20} color={colors.text} />
            <Text style={typography.body}>Redémarrer le défi</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    profileCard: { alignItems: 'center', marginTop: spacing.xl, gap: 6 },
    avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    nameInput: {
      ...typography.h1,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minWidth: 140,
      textAlign: 'center',
    },
    levelCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
  });
}
