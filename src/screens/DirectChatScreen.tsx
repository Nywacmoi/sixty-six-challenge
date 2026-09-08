import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSocial } from '../context/SocialContext';
import { useConfirm } from '../context/ConfirmContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { subscribeToDirectMessages, directThreadId, GroupMessage } from '../firebase/social';
import { useTabBarClearance } from '../hooks/useTabBarClearance';

function formatTime(ms: number | null) {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function DirectChatScreen({ route, navigation }: any) {
  const { peerUid, peerUsername, peerAvatarColor } = route.params;
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const tabBarClearance = useTabBarClearance();
  const { uid, markDmRead, setActiveDmThreadId, sendDirectMessage } = useSocial();
  const { notify } = useConfirm();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const threadId = uid ? directThreadId(uid, peerUid) : null;

  useEffect(() => {
    if (!threadId) return;
    setActiveDmThreadId(threadId);
    markDmRead(threadId);
    const unsub = subscribeToDirectMessages(threadId, (msgs) => {
      setMessages(msgs);
      markDmRead(threadId);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    return () => {
      unsub();
      setActiveDmThreadId(null);
    };
  }, [threadId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    try {
      await sendDirectMessage(peerUid, peerUsername, peerAvatarColor, text);
    } catch (e: any) {
      setDraft(text);
      notify('Message non envoyé', e?.message ?? 'Vérifie ta connexion et réessaie.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: peerAvatarColor + '33' }]}>
          <Text style={[typography.bodyBold, { color: peerAvatarColor }]}>{peerUsername.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[typography.h2, { flex: 1 }]} numberOfLines={1}>
          {peerUsername}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[typography.caption, { textAlign: 'center' }]}>
                Aucun message pour l'instant. Dis bonjour à {peerUsername} !
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === uid;
            return (
              <View style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[typography.body, mine && { color: '#FFFFFF' }]}>{item.text}</Text>
                  <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.7)' }]}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.inputRow, { marginBottom: tabBarClearance }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Écris un message…"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            multiline
            onSubmitEditing={send}
          />
          <Pressable onPress={send} disabled={!draft.trim() || sending} style={[styles.sendBtn, !draft.trim() && { opacity: 0.4 }]}>
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
    bubble: { maxWidth: '78%', borderRadius: radius.md, padding: spacing.sm },
    bubbleTheirs: { backgroundColor: colors.surface },
    bubbleMine: { backgroundColor: colors.accent },
    time: { fontSize: 10, color: colors.textTertiary, marginTop: 2, alignSelf: 'flex-end' },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      fontSize: 15,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
