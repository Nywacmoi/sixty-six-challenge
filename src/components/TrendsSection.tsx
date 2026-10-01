import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors } from '../theme/theme';
import { useTrends } from '../hooks/useTrends';
import { Comparison, pct, WEEKDAYS, WeekdayTrend } from '../utils/trends';
import { AppIcon } from './AppIcon';

// Progression's "Tes tendances": the person's own patterns, said in a
// sentence first and drawn second. Every chart here is one series, so it
// wears one colour and the sentence names the extremes — nobody has to
// match a hue to a legend to find their weak day.
//
// Each block waits for enough history to mean something and says how long
// until it does, rather than presenting two Sundays as a pattern.

const PLOT_H = 84;
const BAR_W = 22;
const VALUE_H = 18;
const SHORT = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
const READY_DAYS = 14;

export function TrendsSection() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const trends = useTrends();
  const { weekdays, sleep, mood, slip } = trends;

  return (
    <View style={styles.stack}>
      <WeekdayCard trend={weekdays} days={trends.days} styles={styles} />

      {sleep.ready || !mood.ready ? (
        <ComparisonCard
          comparison={sleep}
          icon="moon"
          title="Ton sommeil"
          goodLabel="après une bonne nuit"
          lowLabel="après une petite nuit"
          delta={(pts) => `Une bonne nuit vaut +${pts} points sur ta journée.`}
          reversed="Étonnant : tu tiens mieux après une petite nuit."
          flat="Ton sommeil change peu ta journée — tu tiens bon même après une petite nuit."
          waiting={
            sleep.goodDays >= 10 && sleep.lowDays < 3
              ? 'Presque que des bonnes nuits — pas encore assez de petites nuits pour comparer.'
              : 'Réponds au check-in du matin quelques jours de plus pour voir ce que ton sommeil change à ta journée.'
          }
          goodCount="Bonnes nuits"
          lowCount="Petites nuits"
          styles={styles}
        />
      ) : null}

      {mood.ready && (
        <ComparisonCard
          comparison={mood}
          icon="flash"
          title="Ton énergie du matin"
          goodLabel="les matins en forme"
          lowLabel="les matins à plat"
          delta={(pts) => `Un matin en forme vaut +${pts} points sur ta journée.`}
          reversed="Étonnant : tu tiens mieux les matins où tu es à plat."
          flat="Ton énergie du matin change peu ta journée — tu avances même à plat."
          styles={styles}
        />
      )}

      {slip && (
        <View style={[styles.card, styles.slip]}>
          <View style={[styles.iconWrap, { backgroundColor: slip.habit.color + '26' }]}>
            <AppIcon name={slip.habit.icon} size={18} color={slip.habit.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{slip.habit.name} décroche le week-end</Text>
            <Text style={styles.sub}>
              {pct(slip.week)} en semaine, {pct(slip.weekend)} le samedi et le dimanche.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function WeekdayCard({ trend, days, styles }: { trend: WeekdayTrend; days: number; styles: Styles }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trend.ready) return;
    Animated.timing(grow, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [trend.ready, grow]);

  if (!trend.ready) {
    const lived = READY_DAYS - trend.daysToReady;
    return (
      <View style={styles.card}>
        <Header icon="calendar" title="Ta semaine type" styles={styles} />
        <Text style={styles.sub}>
          Encore {trend.daysToReady} jour{trend.daysToReady > 1 ? 's' : ''} pour comparer tes jours de la semaine entre eux.
        </Text>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${Math.round((lived / READY_DAYS) * 100)}%`, backgroundColor: colors.chart }]} />
        </View>
      </View>
    );
  }

  const rates = trend.rates as number[];
  const { best, worst } = trend;

  return (
    <View style={styles.card}>
      <Header icon="calendar" title={worst != null ? `Ton jour faible : le ${WEEKDAYS[worst]}` : 'Pas de jour faible'} styles={styles} />
      <Text style={styles.sub}>
        {worst != null && best != null
          ? `${pct(rates[worst])} de tes habitudes tenues ce jour-là, contre ${pct(rates[best])} le ${WEEKDAYS[best]}.`
          : 'Ta semaine est régulière : moins de 10 points d’écart entre tes jours.'}
      </Text>

      <View style={styles.chart}>
        <View style={styles.plot}>
          {rates.map((r, i) => {
            const labelled = i === best || i === worst || i === selected;
            return (
              <Pressable
                key={i}
                style={styles.column}
                onPress={() => setSelected((s) => (s === i ? null : i))}
                accessibilityRole="button"
                accessibilityLabel={`${WEEKDAYS[i]}, ${pct(r)} en moyenne sur ${trend.samples[i]} ${WEEKDAYS[i]}s`}
              >
                {labelled && <Text style={[styles.value, i === selected && { color: colors.text }]}>{pct(r)}</Text>}
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      backgroundColor: colors.chart,
                      height: grow.interpolate({ inputRange: [0, 1], outputRange: [0, r * PLOT_H] }),
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.baseline} />
        <View style={styles.axis}>
          {SHORT.map((d, i) => (
            <Text key={d} style={[styles.tick, (i === worst || i === selected) && { color: colors.text }]}>
              {d}
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.foot}>
        {selected != null
          ? `Le ${WEEKDAYS[selected]} : ${pct(rates[selected])} en moyenne, sur ${trend.samples[selected]} ${WEEKDAYS[selected]}s.`
          : `Moyenne par jour, sur tes ${days} derniers jours terminés. Touche un jour pour son détail.`}
      </Text>
    </View>
  );
}

function ComparisonCard({
  comparison,
  icon,
  title,
  goodLabel,
  lowLabel,
  delta,
  reversed,
  flat,
  waiting,
  goodCount,
  lowCount,
  styles,
}: {
  comparison: Comparison;
  icon: string;
  title: string;
  goodLabel: string;
  lowLabel: string;
  delta: (pts: number) => string;
  reversed: string;
  flat: string;
  // Only for a comparison that can show before it's ready.
  waiting?: string;
  goodCount?: string;
  lowCount?: string;
  styles: Styles;
}) {
  const { colors } = useTheme();
  const { ready, good, low, goodDays, lowDays } = comparison;

  if (!ready) {
    return (
      <View style={styles.card}>
        <Header icon={icon} title={title} styles={styles} />
        <Text style={styles.sub}>{waiting}</Text>
        <View style={styles.counts}>
          <Count label={goodCount ?? ''} n={goodDays} styles={styles} colors={colors} />
          <Count label={lowCount ?? ''} n={lowDays} styles={styles} colors={colors} />
        </View>
      </View>
    );
  }

  const pts = Math.round((good! - low!) * 100);
  return (
    <View style={styles.card}>
      <Header icon={icon} title={title} styles={styles} />
      {/* Two numbers: the number is the chart. */}
      <View style={styles.pair}>
        <View style={styles.stat}>
          <Text style={styles.big}>{pct(good!)}</Text>
          <Text style={styles.statLabel}>{goodLabel}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.big}>{pct(low!)}</Text>
          <Text style={styles.statLabel}>{lowLabel}</Text>
        </View>
      </View>
      <Text style={[styles.sub, { marginTop: spacing.sm + 2 }]}>{pts >= 10 ? delta(pts) : pts <= -10 ? reversed : flat}</Text>
    </View>
  );
}

function Count({ label, n, styles, colors }: { label: string; n: number; styles: Styles; colors: ThemeColors }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countLabel}>{label}</Text>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i < n ? colors.chart : colors.surfaceElevated }]} />
        ))}
      </View>
    </View>
  );
}

function Header({ icon, title, styles }: { icon: string; title: string; styles: Styles }) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <AppIcon name={icon} size={16} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    stack: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, flexShrink: 1 },
    sub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 6 },
    track: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceElevated, marginTop: spacing.md, overflow: 'hidden' },
    trackFill: { height: 4, borderRadius: 2 },

    chart: { marginTop: spacing.md },
    plot: { flexDirection: 'row', height: PLOT_H + VALUE_H, alignItems: 'flex-end' },
    column: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
    value: { fontFamily: fonts.bold, fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
    // Rounded where the value ends, square where it starts.
    bar: { width: BAR_W, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    baseline: { height: 1, backgroundColor: colors.border },
    axis: { flexDirection: 'row', marginTop: 6 },
    tick: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 11, color: colors.textTertiary },
    // Two lines tall whatever it says, so tapping a day doesn't resize the card.
    foot: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, minHeight: 30, color: colors.textTertiary, marginTop: spacing.sm },

    pair: { flexDirection: 'row', alignItems: 'stretch', marginTop: spacing.md },
    stat: { flex: 1 },
    big: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -1, color: colors.text },
    statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    divider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },

    counts: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
    count: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    countLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
    dots: { flexDirection: 'row', gap: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },

    slip: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconWrap: { width: 38, height: 38, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  });
}
