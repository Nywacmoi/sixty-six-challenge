import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSocial } from '../context/SocialContext';
import { useConfirm } from '../context/ConfirmContext';
import { fonts, radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { useTabBarClearance } from '../hooks/useTabBarClearance';
import { PrimaryButton } from '../components/PrimaryButton';
import { SocialGroup, getProfile, PublicProfile } from '../firebase/social';
import { scrollFocusedIntoView } from '../utils/scrollFocusedIntoView';

const GROUP_EMOJIS = ['🔥', '💪', '🧘', '📚', '🏃', '🎯'];

function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[styles_.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33' }]}>
      <Text style={{ color, fontFamily: fonts.display, fontSize: size * 0.45 }}>{name[0]?.toUpperCase()}</Text>
    </View>
  );
}

const styles_ = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
});

function UsernameSetup({ colors, typography }: { colors: ThemeColors; typography: Typography }) {
  const styles = createStyles(colors, typography);
  const { setUsername } = useSocial();
  const { notify } = useConfirm();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await setUsername(draft.trim());
    } catch (e: any) {
      notify('Impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.setupCard}>
      <Text style={typography.h2}>Choisis ton pseudo</Text>
      <Text style={[typography.caption, { marginTop: spacing.xs, marginBottom: spacing.md }]}>
        Il sera visible par les gens que tu ajoutes ou qui rejoignent tes groupes.
      </Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onFocus={scrollFocusedIntoView}
        placeholder="ex. Theo99"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        autoCapitalize="none"
        maxLength={20}
      />
      <PrimaryButton label={saving ? 'Un instant…' : 'Valider'} onPress={submit} disabled={!draft.trim() || saving} style={{ marginTop: spacing.md }} />
    </View>
  );
}

function FriendsTab({ colors, typography }: { colors: ThemeColors; typography: Typography }) {
  const styles = createStyles(colors, typography);
  const tabBarClearance = useTabBarClearance();
  const { following, addFriend, removeFriend, refreshing, refresh } = useSocial();
  const { notify, confirmAction } = useConfirm();
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  const submit = async () => {
    if (!draft.trim()) return;
    setAdding(true);
    try {
      await addFriend(draft.trim());
      setDraft('');
    } catch (e: any) {
      notify('Introuvable', e?.message ?? "Ce pseudo n'existe pas.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <FlatList
      data={following}
      keyExtractor={(f) => f.uid}
      onRefresh={refresh}
      refreshing={refreshing}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + tabBarClearance }}
      ListHeaderComponent={
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={scrollFocusedIntoView}
            placeholder="Pseudo d'un ami"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { flex: 1 }]}
            autoCapitalize="none"
          />
          <Pressable onPress={submit} disabled={adding || !draft.trim()} style={styles.addBtn}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      }
      ListEmptyComponent={
        <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xl }]}>
          Ajoute quelqu'un avec son pseudo pour voir sa progression ici.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.feedCard}
          onLongPress={() =>
            confirmAction('Retirer cet ami ?', `${item.username} ne sera plus dans ta liste.`, 'Retirer', () => removeFriend(item.uid))
          }
        >
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Avatar name={item.username} color={item.avatarColor} />
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{item.username}</Text>
              <Text style={typography.caption}>Jour {item.currentDay} · Niveau {item.level}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color={colors.accent} />
              <Text style={[typography.bodyBold, { color: colors.accent }]}>{item.currentStreak}</Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

function GroupCard({
  group,
  colors,
  typography,
  navigation,
}: {
  group: SocialGroup;
  colors: ThemeColors;
  typography: Typography;
  navigation: any;
}) {
  const styles = createStyles(colors, typography);
  const { hasUnread } = useSocial();
  const [expanded, setExpanded] = useState(false);
  const [members, setMembers] = useState<PublicProfile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const unread = hasUnread(group.id);

  const toggle = async () => {
    setExpanded((v) => !v);
    if (!members && !loading) {
      setLoading(true);
      const profiles = await Promise.all(group.memberIds.map((id) => getProfile(id)));
      setMembers(profiles.filter((p): p is PublicProfile => p !== null).sort((a, b) => b.currentStreak - a.currentStreak));
      setLoading(false);
    }
  };

  const openChat = () => {
    navigation.navigate('GroupChat', { groupId: group.id, groupName: group.name, groupEmoji: group.emoji });
  };

  return (
    <Pressable style={styles.squadCard} onPress={toggle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ fontSize: 24 }}>{group.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyBold}>{group.name}</Text>
          <Text style={typography.caption}>
            {group.memberIds.length} membre{group.memberIds.length > 1 ? 's' : ''} · Code {group.code}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
      </View>

      <Pressable style={styles.chatBtn} onPress={openChat}>
        {unread && <View style={styles.chatDot} />}
        <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accent} />
        <Text style={[typography.caption, { color: colors.accent, flex: 1 }]} numberOfLines={1}>
          {group.lastMessageText ? group.lastMessageText : 'Ouvrir la discussion'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={styles.membersRow}>
          {loading && <ActivityIndicator color={colors.accent} />}
          {members?.map((m, i) => (
            <View key={m.uid} style={styles.memberRow}>
              <Text style={[typography.small, { width: 18 }]}>{i + 1}</Text>
              <Avatar name={m.username} color={m.avatarColor} size={28} />
              <Text style={[typography.body, { flex: 1, marginLeft: spacing.sm }]}>{m.username}</Text>
              <Ionicons name="flame" size={13} color={colors.accent} />
              <Text style={[typography.caption, { color: colors.accent }]}>{m.currentStreak}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function GroupsTab({ colors, typography, navigation }: { colors: ThemeColors; typography: Typography; navigation: any }) {
  const styles = createStyles(colors, typography);
  const tabBarClearance = useTabBarClearance();
  const { groups, makeGroup, joinGroup, refreshing, refresh, notificationsEnabled, notificationsSupported, setNotificationsEnabled } =
    useSocial();
  const { notify } = useConfirm();
  const [nameDraft, setNameDraft] = useState('');
  const [emoji, setEmoji] = useState(GROUP_EMOJIS[0]);
  const [codeDraft, setCodeDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!nameDraft.trim()) return;
    setBusy(true);
    try {
      const group = await makeGroup(nameDraft.trim(), emoji);
      setNameDraft('');
      notify('Groupe créé !', `Partage le code ${group.code} pour que d'autres te rejoignent.`);
    } catch (e: any) {
      notify('Impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (!codeDraft.trim()) return;
    setBusy(true);
    try {
      const group = await joinGroup(codeDraft.trim());
      if (!group) notify('Code introuvable', "Vérifie le code et réessaie.");
      else setCodeDraft('');
    } catch (e: any) {
      notify('Impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <FlatList
      data={groups}
      keyExtractor={(g) => g.id}
      onRefresh={refresh}
      refreshing={refreshing}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + tabBarClearance }}
      ListHeaderComponent={
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <View style={styles.createCard}>
            <Text style={[typography.caption, { marginBottom: spacing.xs }]}>CRÉER UN GROUPE</Text>
            <View style={styles.addRow}>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                onFocus={scrollFocusedIntoView}
                placeholder="Nom du groupe"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { flex: 1 }]}
              />
              <Pressable onPress={create} disabled={busy || !nameDraft.trim()} style={styles.addBtn}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.emojiRow}>
              {GROUP_EMOJIS.map((e) => (
                <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emojiOption, e === emoji && { borderColor: colors.accent }]}>
                  <Text style={{ fontSize: 18 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.createCard}>
            <Text style={[typography.caption, { marginBottom: spacing.xs }]}>REJOINDRE AVEC UN CODE</Text>
            <View style={styles.addRow}>
              <TextInput
                value={codeDraft}
                onChangeText={setCodeDraft}
                onFocus={scrollFocusedIntoView}
                placeholder="Ex. AB12CD"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { flex: 1 }]}
                autoCapitalize="characters"
              />
              <Pressable onPress={join} disabled={busy || !codeDraft.trim()} style={styles.addBtn}>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
          {notificationsSupported && (
            <View style={styles.createCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>Notifications de groupe</Text>
                  <Text style={[typography.caption, { marginTop: 2 }]}>
                    Une alerte s'affiche quand quelqu'un écrit, tant que l'appli reste ouverte (un onglet en fond suffit — pas besoin de la regarder).
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(v) => {
                    setNotificationsEnabled(v);
                  }}
                  trackColor={{ true: colors.accent }}
                />
              </View>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <Text style={[typography.caption, { textAlign: 'center' }]}>Crée un groupe ou rejoins-en un avec un code.</Text>
      }
      renderItem={({ item }) => <GroupCard group={item} colors={colors} typography={typography} navigation={navigation} />}
    />
  );
}

export default function SocialScreen({ navigation }: any) {
  const [tab, setTab] = useState<'feed' | 'squads'>('feed');
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const { ready, username } = useSocial();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: topInset + spacing.sm }}>
        <Text style={typography.display}>Social</Text>
        {username && (
          <View style={styles.tabBar}>
            <Pressable style={[styles.tabBtn, tab === 'feed' && styles.tabBtnActive]} onPress={() => setTab('feed')}>
              <Text style={[typography.bodyBold, tab !== 'feed' && { color: colors.textSecondary }]}>Amis</Text>
            </Pressable>
            <Pressable style={[styles.tabBtn, tab === 'squads' && styles.tabBtnActive]} onPress={() => setTab('squads')}>
              <Text style={[typography.bodyBold, tab !== 'squads' && { color: colors.textSecondary }]}>Groupes</Text>
            </Pressable>
          </View>
        )}
      </View>

      {!ready ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !username ? (
        <View style={{ padding: spacing.lg }}>
          <UsernameSetup colors={colors} typography={typography} />
        </View>
      ) : tab === 'feed' ? (
        <FriendsTab colors={colors} typography={typography} />
      ) : (
        <GroupsTab colors={colors} typography={typography} navigation={navigation} />
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      padding: 4,
      marginTop: spacing.md,
    },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
    tabBtnActive: { backgroundColor: colors.surfaceElevated },
    setupCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    addBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    createCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    emojiRow: { flexDirection: 'row', gap: spacing.xs },
    emojiOption: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    squadCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    membersRow: { marginTop: spacing.md, gap: spacing.sm },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    chatBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
      marginTop: spacing.sm,
    },
    chatDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger },
  });
}
