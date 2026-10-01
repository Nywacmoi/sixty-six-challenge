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
import { SocialGroup, getProfile, PublicProfile, directThreadId, todayStateOf, sendGroupMessage } from '../firebase/social';
import { useDailyFlag } from '../hooks/useDailyFlag';
import { joinNames } from '../utils/joinNames';
import { todayKey } from '../utils/date';
import { scrollFocusedIntoView } from '../utils/scrollFocusedIntoView';
import { AppIcon } from '../components/AppIcon';

const GROUP_EMOJIS = ['flame', 'fitness', 'leaf', 'book', 'walk', 'locate'];
const GROUP_EMOJI_NAMES: Record<string, string> = {
  flame: 'Feu',
  fitness: 'Muscle',
  leaf: 'Méditation',
  book: 'Livres',
  walk: 'Course',
  locate: 'Cible',
};

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

function FriendsTab({ colors, typography, navigation }: { colors: ThemeColors; typography: Typography; navigation: any }) {
  const styles = createStyles(colors, typography);
  const tabBarClearance = useTabBarClearance();
  const { uid, following, addFriend, removeFriend, refreshing, refresh, hasDmUnread } = useSocial();
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
          <Pressable
            onPress={submit}
            disabled={adding || !draft.trim()}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Ajouter cet ami"
          >
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
        <FriendRow
          item={item}
          styles={styles}
          colors={colors}
          typography={typography}
          unread={!!uid && hasDmUnread(directThreadId(uid, item.uid))}
          onRemove={() =>
            confirmAction('Retirer cet ami\u202f?', `${item.username} ne sera plus dans ta liste.`, 'Retirer', () => removeFriend(item.uid))
          }
          onMessage={() =>
            navigation.navigate('DirectChat', { peerUid: item.uid, peerUsername: item.username, peerAvatarColor: item.avatarColor })
          }
        />
      )}
    />
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

// One friend: who they are, how today is going for them, and — when it
// isn't done — a way to nudge. The relance is a direct message through the
// existing messaging, so it needs no new permissions and lands where they
// already look; once a day per friend, so it stays a nudge.
function FriendRow({
  item,
  styles,
  colors,
  typography,
  unread,
  onRemove,
  onMessage,
}: {
  item: PublicProfile;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  typography: Typography;
  unread: boolean;
  onRemove: () => void;
  onMessage: () => void;
}) {
  const { sendDirectMessage } = useSocial();
  const [relanced, markRelanced] = useDailyFlag(`relance:${item.uid}`);
  const [sending, setSending] = useState(false);
  const { state, remaining } = todayStateOf(item, todayKey());

  const statusText =
    state === 'done'
      ? 'Journée validée'
      : state === 'partial'
        ? `${item.today!.done}/${item.today!.total} aujourd’hui`
        : 'Pas encore commencé';
  const statusColor = state === 'done' ? colors.success : state === 'partial' ? colors.accent : colors.textTertiary;

  const relance = async () => {
    if (relanced || sending) return;
    setSending(true);
    try {
      const rest = remaining ? `il te reste ${plural(remaining, 'habitude')} aujourd’hui` : 'ta journée t’attend';
      await sendDirectMessage(item.uid, item.username, item.avatarColor, `Petite relance\u202f: ${rest}. On ne lâche rien.`);
      await markRelanced();
    } finally {
      setSending(false);
    }
  };

  return (
    <Pressable style={styles.feedCard} onLongPress={onRemove}>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Avatar name={item.username} color={item.avatarColor} />
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyBold} numberOfLines={1}>
            {item.username}
            <Text style={typography.caption}>  Jour {item.currentDay}</Text>
          </Text>
          {/* Today's status gets the line to itself: it's the point of the
              row, and squeezed next to the day it ended up truncated. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {state === 'done' && <Ionicons name="checkmark-circle" size={13} color={statusColor} />}
            <Text style={[typography.caption, { color: statusColor, flex: 1 }]} numberOfLines={1}>
              {statusText}
            </Text>
          </View>
        </View>
        <View style={styles.streakBadge}>
          <AppIcon name="flame" size={14} color={colors.accent} />
          <Text style={[typography.bodyBold, { color: colors.accent }]}>{item.currentStreak}</Text>
        </View>
        <Pressable
          onPress={onMessage}
          style={styles.msgBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Envoyer un message à ${item.username}`}
        >
          {unread && <View style={styles.msgDot} />}
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.accent} />
        </Pressable>
      </View>
      {state !== 'done' && (
        <Pressable
          onPress={relance}
          disabled={relanced || sending}
          style={[styles.relanceBtn, relanced && { borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={relanced ? `${item.username} déjà relancé aujourd’hui` : `Relancer ${item.username}`}
        >
          <Ionicons name={relanced ? 'checkmark' : 'notifications-outline'} size={14} color={relanced ? colors.textTertiary : colors.accent} />
          <Text style={[styles.relanceText, { color: relanced ? colors.textTertiary : colors.accent }]}>
            {relanced ? 'Relancé aujourd’hui' : sending ? 'Envoi…' : 'Relancer'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function MessagesTab({ colors, typography, navigation }: { colors: ThemeColors; typography: Typography; navigation: any }) {
  const styles = createStyles(colors, typography);
  const tabBarClearance = useTabBarClearance();
  const { uid, threads, hasDmUnread } = useSocial();
  const sorted = [...threads].sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));

  return (
    <FlatList
      data={sorted}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + tabBarClearance }}
      ListEmptyComponent={
        <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xl }]}>
          Aucune conversation pour l'instant. Écris à un ami depuis l'onglet "Amis".
        </Text>
      }
      renderItem={({ item }) => {
        const peerUid = item.participantIds.find((id) => id !== uid);
        const peer = peerUid ? item.participants[peerUid] : null;
        if (!peerUid || !peer) return null;
        const unread = hasDmUnread(item.id);
        return (
          <Pressable
            style={styles.feedCard}
            onPress={() => navigation.navigate('DirectChat', { peerUid, peerUsername: peer.username, peerAvatarColor: peer.avatarColor })}
          >
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Avatar name={peer.username} color={peer.avatarColor} />
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{peer.username}</Text>
                <Text style={typography.caption} numberOfLines={1}>
                  {item.lastMessageText ?? 'Nouvelle conversation'}
                </Text>
              </View>
              {unread && <View style={styles.msgDot} />}
            </View>
          </Pressable>
        );
      }}
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
  const { uid, username } = useSocial();
  const [groupRelanced, markGroupRelanced] = useDailyFlag(`relance-group:${group.id}`);
  const today = todayKey();
  const states = members?.map((m) => ({ m, ...todayStateOf(m, today) })) ?? [];
  const doneCount = states.filter((x) => x.state === 'done').length;
  const missing = states.filter((x) => x.state !== 'done' && x.m.uid !== uid).map((x) => x.m.username);

  // Posted in the group's own chat, naming who hasn't validated yet — that's
  // what a group for accountability is for — once a day per group.
  const relanceGroup = async () => {
    if (!uid || !username || groupRelanced || missing.length === 0) return;
    const names = joinNames(missing);
    await sendGroupMessage(
      group.id,
      uid,
      username,
      `Petite relance du groupe\u202f: ${doneCount} sur ${states.length} ont validé aujourd’hui. Il manque ${names}.`
    );
    await markGroupRelanced();
  };

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
    <Pressable
      style={styles.squadCard}
      onPress={toggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${group.name} — ${expanded ? 'masquer les membres' : 'afficher les membres'}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppIcon name={group.emoji} size={22} color={colors.accent} />
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
          {members && (
            <View style={styles.boardHead}>
              <Text style={[typography.bodyBold, { flex: 1 }]}>
                {doneCount}/{states.length} <Text style={typography.caption}>ont validé aujourd’hui</Text>
              </Text>
              {missing.length > 0 && (
                <Pressable onPress={relanceGroup} disabled={groupRelanced} style={[styles.relanceBtn, { marginTop: 0 }, groupRelanced && { borderColor: colors.border }]}>
                  <Ionicons name={groupRelanced ? 'checkmark' : 'notifications-outline'} size={14} color={groupRelanced ? colors.textTertiary : colors.accent} />
                  <Text style={[styles.relanceText, { color: groupRelanced ? colors.textTertiary : colors.accent }]}>
                    {groupRelanced ? 'Groupe relancé' : 'Relancer le groupe'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          {states.map(({ m, state }, i) => (
            <View key={m.uid} style={styles.memberRow}>
              <Text style={[typography.small, { width: 18 }]}>{i + 1}</Text>
              <Avatar name={m.username} color={m.avatarColor} size={28} />
              <Text style={[typography.body, { flex: 1, marginLeft: spacing.sm }]}>{m.username}</Text>
              {state === 'done' ? (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: spacing.sm }} />
              ) : state === 'partial' ? (
                <Text style={[typography.caption, { color: colors.accent, marginRight: spacing.sm }]}>
                  {m.today!.done}/{m.today!.total}
                </Text>
              ) : (
                <Text style={[typography.caption, { marginRight: spacing.sm }]}>—</Text>
              )}
              <AppIcon name="flame" size={13} color={colors.accent} />
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
  const {
    groups,
    makeGroup,
    joinGroup,
    refreshing,
    refresh,
    notificationsEnabled,
    notificationsSupported,
    setNotificationsEnabled,
    publicGroups,
    discoveringGroups,
    discoverPublicGroups,
    joinPublicGroup,
  } = useSocial();
  const { notify } = useConfirm();
  const [nameDraft, setNameDraft] = useState('');
  const [emoji, setEmoji] = useState(GROUP_EMOJIS[0]);
  const [isPublic, setIsPublic] = useState(false);
  const [codeDraft, setCodeDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);

  const create = async () => {
    if (!nameDraft.trim()) return;
    setBusy(true);
    try {
      const group = await makeGroup(nameDraft.trim(), emoji, isPublic);
      setNameDraft('');
      notify(
        'Groupe créé !',
        isPublic
          ? "Ton groupe est public — n'importe qui peut le trouver et le rejoindre. Le code marche aussi."
          : `Partage le code ${group.code} pour que d'autres te rejoignent.`
      );
    } catch (e: any) {
      notify('Impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  };

  const toggleDiscover = () => {
    const next = !showDiscover;
    setShowDiscover(next);
    if (next) discoverPublicGroups();
  };

  const joinDiscovered = async (groupId: string) => {
    setBusy(true);
    try {
      await joinPublicGroup(groupId);
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
              <Pressable
                onPress={create}
                disabled={busy || !nameDraft.trim()}
                style={styles.addBtn}
                accessibilityRole="button"
                accessibilityLabel="Créer le groupe"
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.emojiRow}>
              {GROUP_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[styles.emojiOption, e === emoji && { borderColor: colors.accent }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: e === emoji }}
                  accessibilityLabel={`Icône ${GROUP_EMOJI_NAMES[e] ?? e}`}
                >
                  <AppIcon name={e} size={18} color={e === emoji ? colors.accent : colors.textSecondary} />
                </Pressable>
              ))}
            </View>
            <View style={styles.visibilityRow}>
              <Pressable
                onPress={() => setIsPublic(false)}
                style={[styles.visibilityChip, !isPublic && { borderColor: colors.accent, backgroundColor: colors.accent + '1A' }]}
              >
                <Ionicons name="lock-closed" size={14} color={!isPublic ? colors.accent : colors.textSecondary} />
                <Text style={[typography.bodyBold, !isPublic && { color: colors.accent }]}>Privé</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsPublic(true)}
                style={[styles.visibilityChip, isPublic && { borderColor: colors.accent, backgroundColor: colors.accent + '1A' }]}
              >
                <Ionicons name="earth" size={14} color={isPublic ? colors.accent : colors.textSecondary} />
                <Text style={[typography.bodyBold, isPublic && { color: colors.accent }]}>Public</Text>
              </Pressable>
            </View>
            <Text style={[typography.caption, { marginTop: spacing.xs }]}>
              {isPublic ? "Visible dans \"Groupes publics\", tout le monde peut le rejoindre." : "Rejoignable uniquement avec le code."}
            </Text>
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
              <Pressable
                onPress={join}
                disabled={busy || !codeDraft.trim()}
                style={styles.addBtn}
                accessibilityRole="button"
                accessibilityLabel="Rejoindre avec ce code"
              >
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.createCard}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              onPress={toggleDiscover}
              accessibilityRole="button"
              accessibilityState={{ expanded: showDiscover }}
              accessibilityLabel={showDiscover ? 'Masquer les groupes publics' : 'Afficher les groupes publics'}
            >
              <Ionicons name="earth" size={18} color={colors.accent} />
              <Text style={[typography.bodyBold, { flex: 1 }]}>Groupes publics</Text>
              <Ionicons name={showDiscover ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
            </Pressable>
            {showDiscover && (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {discoveringGroups && <ActivityIndicator color={colors.accent} />}
                {!discoveringGroups && publicGroups.length === 0 && (
                  <Text style={typography.caption}>Aucun groupe public pour l'instant — sois le premier à en créer un !</Text>
                )}
                {publicGroups.map((g) => (
                  <View key={g.id} style={styles.discoverRow}>
                    <AppIcon name={g.emoji} size={18} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{g.name}</Text>
                      <Text style={typography.caption}>
                        {g.memberIds.length} membre{g.memberIds.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Pressable onPress={() => joinDiscovered(g.id)} disabled={busy} style={styles.joinBtn}>
                      <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Rejoindre</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
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
                  accessibilityLabel="Notifications de groupe"
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
  const [tab, setTab] = useState<'feed' | 'messages' | 'squads'>('feed');
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const { ready, username, threads, hasDmUnread } = useSocial();
  const anyDmUnread = threads.some((t) => hasDmUnread(t.id));

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: topInset + spacing.sm }}>
        <Text style={typography.display}>Social</Text>
        {username && (
          <View style={styles.tabBar}>
            <Pressable style={[styles.tabBtn, tab === 'feed' && styles.tabBtnActive]} onPress={() => setTab('feed')}>
              <Text style={[typography.bodyBold, tab !== 'feed' && { color: colors.textSecondary }]}>Amis</Text>
            </Pressable>
            <Pressable style={[styles.tabBtn, tab === 'messages' && styles.tabBtnActive]} onPress={() => setTab('messages')}>
              {anyDmUnread && <View style={styles.tabDot} />}
              <Text style={[typography.bodyBold, tab !== 'messages' && { color: colors.textSecondary }]}>Messages</Text>
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
        <FriendsTab colors={colors} typography={typography} navigation={navigation} />
      ) : tab === 'messages' ? (
        <MessagesTab colors={colors} typography={typography} navigation={navigation} />
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
    tabBtn: { flex: 1, flexDirection: 'row', gap: 5, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    tabBtnActive: { backgroundColor: colors.surfaceElevated },
    tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
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
    msgBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
    msgDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger },
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
    boardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    relanceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      marginTop: spacing.sm + 2,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm + 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accent + '66',
    },
    relanceText: { fontFamily: fonts.semiBold, fontSize: 13 },
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
    visibilityRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    visibilityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    discoverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    joinBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
  });
}
