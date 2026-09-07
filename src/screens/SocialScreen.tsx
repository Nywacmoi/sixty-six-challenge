import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { MOCK_FEED, MOCK_SQUADS } from '../data/mockSocial';
import { useTopInset } from '../hooks/useTopInset';

function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[styles_.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33' }]}>
      <Text style={{ color, fontFamily: 'Anton_400Regular', fontSize: size * 0.45 }}>{name[0]}</Text>
    </View>
  );
}

const styles_ = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
});

function FeedTab({ colors, typography }: { colors: ThemeColors; typography: Typography }) {
  const styles = createStyles(colors, typography);
  return (
    <FlatList
      data={MOCK_FEED}
      keyExtractor={(f) => f.id}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      renderItem={({ item }) => (
        <View style={styles.feedCard}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Avatar name={item.userName} color={item.avatarColor} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={typography.bodyBold}>{item.userName}</Text>
                <Text style={typography.small}>{item.timeAgo}</Text>
              </View>
              <Text style={typography.caption}>{item.habitName} · Jour {item.streak}</Text>
              <Text style={[typography.body, { marginTop: spacing.xs }]}>{item.message}</Text>
              <View style={styles.feedActions}>
                <Ionicons name="flame-outline" size={16} color={colors.textSecondary} />
                <Text style={typography.caption}>{item.likes}</Text>
                <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} style={{ marginLeft: spacing.md }} />
              </View>
            </View>
          </View>
        </View>
      )}
    />
  );
}

function SquadsTab({ colors, typography }: { colors: ThemeColors; typography: Typography }) {
  const styles = createStyles(colors, typography);
  return (
    <FlatList
      data={MOCK_SQUADS}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      renderItem={({ item }) => (
        <View style={styles.squadCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{item.name}</Text>
              <Text style={typography.caption}>{item.memberCount} membres</Text>
            </View>
          </View>
          <View style={styles.membersRow}>
            {[...item.members]
              .sort((a, b) => b.streak - a.streak)
              .map((m, i) => (
                <View key={m.name} style={styles.memberRow}>
                  <Text style={[typography.small, { width: 18 }]}>{i + 1}</Text>
                  <Avatar name={m.name} color={m.avatarColor} size={28} />
                  <Text style={[typography.body, { flex: 1, marginLeft: spacing.sm }]}>{m.name}</Text>
                  <Ionicons name="flame" size={13} color={colors.accent} />
                  <Text style={[typography.caption, { color: colors.accent }]}>{m.streak}</Text>
                </View>
              ))}
          </View>
        </View>
      )}
    />
  );
}

export default function SocialScreen() {
  const [tab, setTab] = useState<'feed' | 'squads'>('feed');
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: topInset + spacing.sm }}>
        <Text style={typography.display}>Social</Text>
        <View style={styles.tabBar}>
          <Pressable style={[styles.tabBtn, tab === 'feed' && styles.tabBtnActive]} onPress={() => setTab('feed')}>
            <Text style={[typography.bodyBold, tab !== 'feed' && { color: colors.textSecondary }]}>Fil</Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, tab === 'squads' && styles.tabBtnActive]} onPress={() => setTab('squads')}>
            <Text style={[typography.bodyBold, tab !== 'squads' && { color: colors.textSecondary }]}>Groupes</Text>
          </Pressable>
        </View>
      </View>
      {tab === 'feed' ? <FeedTab colors={colors} typography={typography} /> : <SquadsTab colors={colors} typography={typography} />}
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
    feedCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    feedActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
    squadCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    membersRow: { marginTop: spacing.md, gap: spacing.sm },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  });
}
