import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors } from '../theme/theme';
import { useSkills } from '../hooks/useSkills';
import { SkillRadar } from './SkillRadar';
import { AppIcon } from './AppIcon';

// Profil's character sheet: the radar for the shape, then each skill as a
// row that says what it is, how far to the next level, and — the useful
// part — which of your habits feed it. A skill nothing trains says so, which
// is the most direct suggestion the app can make about what to add next.
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function SkillsSection() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const skills = useSkills();
  const { width } = useWindowDimensions();

  return (
    <View>
      <SkillRadar skills={skills} width={Math.min(width - spacing.lg * 2, 360)} />

      <View style={styles.list}>
        {skills.map((s) => (
          <View key={s.id} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: s.color + '26' }]}>
              <AppIcon name={s.icon} size={18} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.top}>
                <Text style={styles.name}>
                  {s.label}
                  <Text style={styles.tier}> · {s.tier}</Text>
                </Text>
                <Text style={[styles.level, { color: s.color }]}>NIV. {s.level}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(s.progress * 100)}%`, backgroundColor: s.color }]} />
              </View>
              {/* Sources on the left, allowed to truncate; the distance to the
                  next level on the right, never cut — it's the actionable part. */}
              <View style={styles.bottom}>
                <Text style={[styles.fed, { flex: 1 }]} numberOfLines={1}>
                  {s.fedBy.length > 0 ? capitalize(s.fedBy.join(', ')) : 'Aucune habitude ne l’entraîne encore'}
                </Text>
                <Text style={styles.next}>
                  {s.toNext} → niv. {s.level + 1}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.sm },
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
    iconWrap: { width: 38, height: 38, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
    top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    name: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
    tier: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
    level: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },
    track: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceElevated, marginTop: 8, overflow: 'hidden' },
    fill: { height: 4, borderRadius: 2 },
    bottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
    fed: { fontFamily: fonts.regular, fontSize: 11, color: colors.textTertiary },
    next: { fontFamily: fonts.bold, fontSize: 11, color: colors.textSecondary },
  });
}
