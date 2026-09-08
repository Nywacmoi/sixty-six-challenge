import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { AVATAR_ITEMS, AvatarSlot } from '../data/avatarItems';
import { Profile } from '../types';

const SLOT_KEYS: Partial<Record<AvatarSlot, keyof Profile>> = {
  hair: 'avatarHair',
  accessory: 'avatarAccessory',
  facialHair: 'avatarFacialHair',
  expression: 'avatarExpression',
};

export function AvatarWardrobe() {
  const { profile, currentDay, updateProfile } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  const toggle = (item: (typeof AVATAR_ITEMS)[number]) => {
    const key = SLOT_KEYS[item.slot];
    if (!key) return;
    const current = profile[key];
    updateProfile({ [key]: current === item.id ? null : item.id } as any);
  };

  return (
    <View style={styles.grid}>
      {AVATAR_ITEMS.map((item) => {
        const unlocked = currentDay >= item.unlockDay;
        const key = SLOT_KEYS[item.slot];
        const canEquip = !!key;
        const equipped = canEquip ? profile[key!] === item.id : unlocked;

        return (
          <Pressable
            key={item.id}
            disabled={!unlocked || !canEquip}
            onPress={() => toggle(item)}
            style={[styles.card, !unlocked && styles.cardLocked, equipped && styles.cardEquipped]}
          >
            <Text style={styles.emoji}>{unlocked ? item.emoji : '🔒'}</Text>
            <Text style={[typography.small, { textAlign: 'center', marginTop: 6 }]}>{item.name}</Text>
            {!unlocked ? (
              <Text style={[typography.small, { color: colors.textTertiary, marginTop: 2 }]}>Jour {item.unlockDay}</Text>
            ) : canEquip ? (
              <View style={styles.statusRow}>
                {equipped && <Ionicons name="checkmark-circle" size={13} color={colors.accent} />}
                <Text style={[typography.small, { color: equipped ? colors.accent : colors.textTertiary }]}>
                  {equipped ? 'Équipé' : 'Toucher pour équiper'}
                </Text>
              </View>
            ) : (
              <Text style={[typography.small, { color: colors.gold, marginTop: 2 }]}>Débloqué</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    card: {
      width: '31%',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    cardLocked: { opacity: 0.5 },
    cardEquipped: { borderColor: colors.accent, backgroundColor: colors.accent + '0F' },
    emoji: { fontSize: 26 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  });
}
