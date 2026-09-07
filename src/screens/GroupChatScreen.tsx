import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSocial } from '../context/SocialContext';
import { useConfirm } from '../context/ConfirmContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { subscribeToGroupMessages, sendGroupMessage, GroupMessage } from '../firebase/social';
import { TAB_BAR_BASE_HEIGHT } from '../navigation/CustomTabBar';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';

function formatTime(ms: number | null) {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function GroupChatScreen({ route, navigation }: any) {
  const { groupId, groupName, groupEmoji } = route.params;
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const tabBarClearance = keyboardVisible ? 0 : TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 14);
  const { uid, username, markGroupRead, setActiveChatGroupId } = useSocial();
  const { notify } = useConfirm();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setActiveChatGroupId(groupId);
    markGroupRead(groupId);
    const unsub = subscribeToGroupMessages(groupId, (msgs) => {
      setMessages(msgs);
      markGroupRead(groupId);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    return () => {
      unsub();
      setActiveChatGroupId(null);
    };
  }, [groupId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !uid || !username || sending) return;
    setDraft('');
    setSending(true);
    try {
      await sendGroupMessage(groupId, uid, username, text);
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
        <Text style={{ fontSize: 20 }}>{groupEmoji}</Text>
        <Text style={[typography.h2, { flex: 1 }]} numberOfLines={1}>
          {groupName}
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
                Aucun message pour l'instant. Lance la discussion !
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === uid;
            return (
              <View style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {!mine && <Text style={[typography.small, { color: colors.accent, marginBottom: 2 }]}>{item.senderUsername}</Text>}
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
