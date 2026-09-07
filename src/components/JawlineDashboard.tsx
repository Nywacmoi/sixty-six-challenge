import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export type WeekDay = { date: string; done: boolean; isToday: boolean };

// Premium dark dashboard card, styled after the reference — day counter,
// streak, and a 7-day glance — deliberately without any face-scan/score
// mechanic (see conversation: no fabricated appearance rating, ever).
export function JawlineDashboard({
  currentDay,
  totalDays,
  streak,
  bestStreak,
  weekDays,
}: {
  currentDay: number;
  totalDays: number;
  streak: number;
  bestStreak: number;
  weekDays: WeekDay[];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>
            JOUR {currentDay}/{totalDays}
          </Text>
        </View>
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={16} color="#FF9142" />
          <Text style={styles.streakText}>{streak}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>SÉRIE ACTUELLE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{bestStreak}</Text>
          <Text style={styles.statLabel}>MEILLEURE SÉRIE</Text>
        </View>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((d) => {
          const [y, m, day] = d.date.split('-').map(Number);
          const letter = DAY_LETTERS[new Date(y, m - 1, day).getDay()];
          return (
            <View key={d.date} style={styles.weekDay}>
              <Text style={styles.weekLetter}>{letter}</Text>
              <View
                style={[
                  styles.weekDot,
                  d.done && styles.weekDotDone,
                  d.isToday && !d.done && styles.weekDotToday,
                ]}
              >
                {d.done && <Ionicons name="checkmark" size={12} color="#0B0B0D" />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111114',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayPill: {
    backgroundColor: '#1F1F24',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  dayPillText: { color: '#C9E265', fontFamily: 'Poppins_700Bold', fontSize: 12, letterSpacing: 0.5 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { color: '#F5F5F0', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  statBlock: { flex: 1 },
  statValue: { color: '#F5F5F0', fontFamily: 'Anton_400Regular', fontSize: 30 },
  statLabel: { color: '#8A8A90', fontFamily: 'Poppins_600SemiBold', fontSize: 10.5, letterSpacing: 0.4, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#2A2A2E', marginHorizontal: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  weekDay: { alignItems: 'center', gap: 6 },
  weekLetter: { color: '#6B6B72', fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
  weekDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1F1F24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  weekDotDone: { backgroundColor: '#C9E265', borderColor: '#C9E265' },
  weekDotToday: { borderColor: '#C9E265' },
});
