import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { ASSISTANT_ENTRIES, AssistantEntry } from '../data/assistantIndex';

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function AssistantScreen({ navigation }: any) {
  const { habits } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ASSISTANT_ENTRIES;
    return ASSISTANT_ENTRIES.filter((e) => {
      const haystack = normalize([e.label, e.description, ...e.keywords].join(' '));
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [query]);

  const handlePress = (entry: AssistantEntry) => {
    entry.run({ navigation, habits });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
        <Text style={typography.display}>Assistant</Text>
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          Dis-moi ce que tu cherches, je t'y emmène.
        </Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ex. programme sportif, rappels, ami…"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoFocus={false}
          />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        ListEmptyComponent={
          <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xl }]}>
            Rien ne correspond à "{query}". Essaie un autre mot.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => handlePress(item)}>
            <View style={styles.iconBadge}>
              <Ionicons name={item.icon} size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{item.label}</Text>
              <Text style={typography.caption}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.md,
      color: colors.text,
      fontSize: 15,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.accent + '1A',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
