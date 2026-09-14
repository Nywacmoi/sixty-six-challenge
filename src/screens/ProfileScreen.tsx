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
import { StatStrip } from '../components/StatStrip';
import { SectionLabel } from '../components/SectionLabel';
import { BackupSettings } from '../components/BackupSettings';
import { AccountSettings } from '../components/AccountSettings';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { AvatarProgress } from '../components/AvatarProgress';
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
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl + tabBarClearance }}>
        <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
          <Text style={typography.caption}>NIVEAU {levelInfo.level}</Text>
          <Text style={typography.display}>Profil</Text>
        </View>

        {/* The avatar is this screen's one focal point, the way the ring is on
            Aujourd'hui — so it stands on the background rather than inside a
            card, and the name sits directly under it instead of being one more
            row in a box. */}
        <View style={styles.hero}>
          <AvatarProgress currentDay={currentDay} totalDays={TOTAL_DAYS}>
            <View style={[styles.avatar, { backgroundColor: profile.avatarColor + '1F' }]}>
              <AvatarDisplay
                color={profile.avatarColor}
                seed={profile.avatarSeed}
                gender={profile.avatarGender}
                hair={profile.avatarHair}
                accessory={profile.avatarAccessory}
                facialHair={profile.avatarFacialHair}
                expression={profile.avatarExpression}
                hasAura={currentDay >= 75}
                hasStar={currentDay >= 99}
                size={118}
              />
            </View>
          </AvatarProgress>

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
            <Pressable
              onPress={() => setEditingName(true)}
              style={styles.nameRow}
              accessibilityRole="button"
              accessibilityLabel="Modifier ton prénom"
            >
              <Text style={styles.name}>{profile.name}</Text>
              <Ionicons name="pencil" size={15} color={colors.textTertiary} />
            </Pressable>
          )}

          <View style={styles.genderRow}>
            {(['homme', 'femme'] as const).map((g) => {
              const active = profile.avatarGender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => updateProfile({ avatarGender: g })}
                  style={[styles.genderChip, active && { borderColor: colors.accent, backgroundColor: colors.accent + '14' }]}
                >
                  <Text style={[styles.genderText, active && { color: colors.accent }]}>
                    {g === 'homme' ? 'Homme' : 'Femme'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.xpLine}>
          <View style={styles.xpTop}>
            <SectionLabel>{`NIVEAU ${levelInfo.level + 1}`}</SectionLabel>
            <Text style={styles.xpValue}>
              {levelInfo.xpIntoLevel} / {levelInfo.xpForNextLevel} XP
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${Math.round(levelInfo.progress * 100)}%` }]} />
          </View>
        </View>

        <StatStrip
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}
          items={[
            { value: habits.length, label: 'HABITUDES' },
            { value: getTotalCompletions(), label: 'CHECK-INS' },
            { value: profile.streakFreezes, label: 'BOUCLIERS' },
          ]}
        />

        <SectionLabel style={styles.sectionLabel}>GARDE-ROBE</SectionLabel>
        <Text style={styles.sectionSub}>Débloque des tenues en avançant dans ton défi</Text>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <AvatarWardrobe />
        </View>

        <SectionLabel style={styles.sectionLabel}>COMPTE</SectionLabel>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <AccountSettings />
        </View>

        <SectionLabel style={styles.sectionLabel}>RÉGLAGES</SectionLabel>
        {/* One bordered list with hairlines between rows, not four separate
            rounded boxes: settings are a single group of related switches, and
            stacking them as individual cards made each one look like its own
            feature. */}
        <View style={styles.list}>
          <View style={styles.listRow}>
            <View style={styles.listLeft}>
              <Ionicons name={mode === 'dark' ? 'moon-outline' : 'sunny-outline'} size={18} color={colors.textSecondary} />
              <Text style={typography.body}>Mode sombre</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.accent }}
              accessibilityLabel="Mode sombre"
            />
          </View>

          <View style={[styles.listRow, styles.listRowDivided, { flexDirection: 'column', alignItems: 'stretch', gap: spacing.sm }]}>
            <View style={styles.listRowInner}>
              <View style={styles.listLeft}>
                <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
                <Text style={typography.body}>Rappels quotidiens</Text>
              </View>
              <Switch
                value={profile.reminderEnabled}
                onValueChange={toggleReminders}
                trackColor={{ true: colors.accent }}
                accessibilityLabel="Rappels quotidiens"
              />
            </View>
            {profile.reminderEnabled && (
              <>
                <Text style={styles.listHint}>
                  Un rappel s'affiche dans l'appli si tes habitudes du jour ne sont pas encore cochées après :
                </Text>
                <View style={styles.timeRow}>
                  {REMINDER_TIMES.map((t) => {
                    const active = profile.reminderHour === t.hour && profile.reminderMinute === t.minute;
                    return (
                      <Pressable
                        key={t.label}
                        onPress={() => setReminderTime(t.hour, t.minute)}
                        style={[styles.timeChip, active && { backgroundColor: colors.accent + '14', borderColor: colors.accent }]}
                      >
                        <Text style={[styles.timeText, active && { color: colors.accent }]}>{t.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          <Pressable style={[styles.listRow, styles.listRowDivided]} onPress={resetChallenge}>
            <View style={styles.listLeft}>
              <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
              <Text style={typography.body}>Redémarrer le défi</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
          </Pressable>
        </View>

        <SectionLabel style={styles.sectionLabel}>SAUVEGARDE</SectionLabel>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <BackupSettings />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg },
    hero: { alignItems: 'center', marginTop: spacing.lg },
    avatar: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.md },
    name: { fontFamily: fonts.display, fontSize: 26, color: colors.text, letterSpacing: -0.5 },
    nameInput: {
      fontFamily: fonts.display,
      fontSize: 26,
      color: colors.text,
      letterSpacing: -0.5,
      marginTop: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minWidth: 140,
      textAlign: 'center',
    },
    genderRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    genderChip: {
      paddingVertical: 5,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    genderText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary, letterSpacing: 0.3 },
    xpLine: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
    xpTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    xpValue: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6, color: colors.gold },
    xpTrack: {
      height: 3,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.pill,
      marginTop: 6,
      overflow: 'hidden',
    },
    xpFill: { height: '100%', backgroundColor: colors.gold, borderRadius: radius.pill },
    sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm + 2, marginHorizontal: spacing.lg },
    sectionSub: {
      ...typography.small,
      color: colors.textTertiary,
      marginTop: -spacing.xs,
      marginBottom: spacing.sm + 2,
      marginHorizontal: spacing.lg,
    },
    list: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    listRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md,
    },
    listRowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listRowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    listLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    listHint: { ...typography.small, color: colors.textTertiary, lineHeight: 15 },
    timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    timeChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingVertical: 5,
      paddingHorizontal: spacing.md - 2,
    },
    timeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary, letterSpacing: 0.3 },
  });
}
