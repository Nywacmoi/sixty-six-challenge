import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, TOTAL_DAYS, ThemeColors, Typography } from '../theme/theme';
import { useConfirm } from '../context/ConfirmContext';
import { useTopInset } from '../hooks/useTopInset';
import { scrollFocusedIntoView } from '../utils/scrollFocusedIntoView';
import { useTabBarClearance } from '../hooks/useTabBarClearance';
import { ProgressBar } from '../components/ProgressBar';
import { BackupSettings } from '../components/BackupSettings';
import { AccountSettings } from '../components/AccountSettings';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { AvatarWardrobe } from '../components/AvatarWardrobe';

const REMINDER_TIMES = [
  { label: '7h', hour: 7, minute: 0 },
  { label: '8h', hour: 8, minute: 0 },
  { label: '12h', hour: 12, minute: 0 },
  { label: '18h', hour: 18, minute: 0 },
  { label: '20h', hour: 20, minute: 0 },
  { label: '21h', hour: 21, minute: 0 },
];

export default function ProfileScreen() {
  const { profile, updateProfile, currentDay, getTotalCompletions, habits, levelInfo } = useApp();
  const { confirmAction } = useConfirm();
  const { colors, typography, mode, toggleTheme } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const tabBarClearance = useTabBarClearance();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);

  const saveName = async () => {
    await updateProfile({ name: nameDraft.trim() || 'Toi' });
    setEditingName(false);
  };

  const toggleReminders = async (value: boolean) => {
    await updateProfile({ reminderEnabled: value });
  };

  const setReminderTime = async (hour: number, minute: number) => {
    await updateProfile({ reminderHour: hour, reminderMinute: minute });
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
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: topInset + spacing.sm, paddingBottom: spacing.xxl + tabBarClearance }}>
        <Text style={typography.display}>Profil</Text>

        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: profile.avatarColor + '1F' }]}>
            <AvatarDisplay
              color={profile.avatarColor}
              seed={profile.avatarSeed}
              hair={profile.avatarHair}
              accessory={profile.avatarAccessory}
              facialHair={profile.avatarFacialHair}
              expression={profile.avatarExpression}
              hasAura={currentDay >= 75}
              hasStar={currentDay >= 99}
              size={118}
            />
          </View>
          {editingName ? (
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onSubmitEditing={saveName}
              onBlur={saveName}
              onFocus={scrollFocusedIntoView}
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

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.xs }]}>Garde-robe</Text>
        <Text style={[typography.caption, { marginBottom: spacing.sm }]}>Débloque des tenues en avançant dans ton défi</Text>
        <AvatarWardrobe />

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Compte</Text>
        <AccountSettings />

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Réglages</Text>

        <View style={styles.settingRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.text} />
            <Text style={typography.body}>Mode sombre</Text>
          </View>
          <Switch value={mode === 'dark'} onValueChange={toggleTheme} trackColor={{ true: colors.accent }} />
        </View>

        <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'stretch', gap: spacing.sm }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <Text style={typography.body}>Rappels quotidiens</Text>
            </View>
            <Switch value={profile.reminderEnabled} onValueChange={toggleReminders} trackColor={{ true: colors.accent }} />
          </View>
          {profile.reminderEnabled && (
            <>
              <Text style={typography.caption}>
                Un rappel s'affiche dans l'appli si tes habitudes du jour ne sont pas encore cochées après :
              </Text>
              <View style={styles.timeRow}>
                {REMINDER_TIMES.map((t) => {
                  const active = profile.reminderHour === t.hour && profile.reminderMinute === t.minute;
                  return (
                    <Pressable
                      key={t.label}
                      onPress={() => setReminderTime(t.hour, t.minute)}
                      style={[styles.timeChip, active && { backgroundColor: colors.accent + '1F', borderColor: colors.accent }]}
                    >
                      <Text style={[typography.bodyBold, active && { color: colors.accent }]}>{t.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <Pressable style={styles.settingRow} onPress={resetChallenge}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name="refresh-outline" size={20} color={colors.text} />
            <Text style={typography.body}>Redémarrer le défi</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Sauvegarde</Text>
        <BackupSettings />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    profileCard: { alignItems: 'center', marginTop: spacing.xl, gap: 6 },
    avatar: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
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
    timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    timeChip: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceElevated,
    },
  });
}
