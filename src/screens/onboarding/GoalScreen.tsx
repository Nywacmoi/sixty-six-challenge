import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, ThemeColors, Typography } from '../../theme/theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StepDots } from '../../components/StepDots';

const GOALS = [
  { id: 'sport', icon: 'walk', label: 'Être plus sportif' },
  { id: 'discipline', icon: 'bulb', label: 'Plus de discipline' },
  { id: 'wellbeing', icon: 'leaf', label: 'Bien-être & mental' },
  { id: 'productivity', icon: 'locate', label: 'Productivité' },
  { id: 'all', icon: 'sparkles', label: 'Un peu de tout' },
];

export default function GoalScreen({ navigation, route }: any) {
  const { updateProfile } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const topInset = Math.min(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 16);
  const [goal, setGoal] = useState<string | null>(null);
  const name: string = route?.params?.name ?? '';

  const finish = async () => {
    await updateProfile({
      name: name || 'Toi',
      goal,
      onboardingCompleted: true,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: topInset + spacing.sm }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={typography.display}>Ton objectif{'\n'}principal ?</Text>
        <View style={styles.grid}>
          {GOALS.map((g) => {
            const selected = goal === g.id;
            return (
              <Pressable
                key={g.id}
                onPress={() => setGoal(g.id)}
                style={[styles.goalCard, selected && { borderColor: colors.accent, backgroundColor: colors.accent + '14' }]}
              >
                <Ionicons name={g.icon as any} size={22} color={selected ? colors.accent : colors.text} />
                <Text style={typography.bodyBold}>{g.label}</Text>
                {selected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} style={{ marginLeft: 'auto' }} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        <StepDots total={3} activeIndex={2} />
        <PrimaryButton label="C'est parti !" onPress={finish} disabled={!goal} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
    grid: { marginTop: spacing.xl, gap: spacing.sm },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
  });
}
