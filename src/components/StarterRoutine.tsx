import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors } from '../theme/theme';
import { AppIcon } from './AppIcon';
import { PrimaryButton } from './PrimaryButton';
import { StarterRoutine as Routine } from '../data/goals';

// The empty Aujourd'hui for someone who answered the onboarding question.
//
// The old empty state was a flame, a slogan and "Ajouter ma première
// habitude" — a blank page right after the app had asked what they wanted.
// This one answers: here are three habits for what you said, one tap away.
// Choosing for yourself is still a link underneath, not a detour.
export function StarterRoutine({
  routine,
  onAccept,
  onChooseOwn,
}: {
  routine: Routine;
  onAccept: () => Promise<void> | void;
  onChooseOwn: () => void;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors);
  const [adding, setAdding] = useState(false);
  const count = routine.habits.length;

  return (
    <View style={styles.wrap}>
      <Text style={typography.kicker}>TA ROUTINE DE DÉPART</Text>
      <Text style={styles.lead}>{routine.lead}</Text>

      <View style={styles.list}>
        {routine.habits.map((h) => (
          <View key={h.name} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: h.color + '26' }]}>
              <AppIcon name={h.icon} size={18} color={h.color} />
            </View>
            <Text style={typography.bodyBold}>{h.name}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton
        label={`Commencer avec ces ${count} habitudes`}
        disabled={adding}
        onPress={async () => {
          // One tap, one write: a second tap while the first is saving would
          // add the routine twice.
          setAdding(true);
          try {
            await onAccept();
          } finally {
            setAdding(false);
          }
        }}
        style={{ marginTop: spacing.lg }}
      />
      <Pressable onPress={onChooseOwn} style={styles.own} accessibilityRole="button">
        <Text style={styles.ownText}>Choisir moi-même</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
    lead: {
      fontFamily: fonts.display,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.4,
      color: colors.text,
      marginTop: spacing.sm,
    },
    list: { marginTop: spacing.lg, gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    iconWrap: { width: 36, height: 36, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
    own: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
    ownText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textSecondary },
  });
}
