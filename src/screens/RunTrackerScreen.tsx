import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirm } from '../context/ConfirmContext';
import { spacing, radius, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { RouteMap } from '../components/RouteMap';
import { routeDistanceKm, formatPace, formatDuration } from '../utils/geo';
import { todayKey } from '../utils/date';
import { RunActivity, RunPoint } from '../types';

type Phase = 'idle' | 'denied' | 'tracking' | 'summary';

export default function RunTrackerScreen({ navigation, route }: any) {
  const { habitId, habitColor } = route.params ?? {};
  const { saveRunActivity } = useApp();
  const { colors, typography } = useTheme();
  const { confirmAction } = useConfirm();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const accent = habitColor ?? colors.accent;

  const [phase, setPhase] = useState<Phase>('idle');
  const [points, setPoints] = useState<RunPoint[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [finished, setFinished] = useState<RunActivity | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const pointsRef = useRef<RunPoint[]>([]);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'tracking') return;
    const id = setInterval(() => {
      if (startTimeRef.current) setElapsedSec(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPhase('denied');
      return;
    }
    pointsRef.current = [];
    setPoints([]);
    setElapsedSec(0);
    startTimeRef.current = Date.now();
    setPhase('tracking');
    subscriptionRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 3000, distanceInterval: 5 },
      (loc) => {
        const next = [...pointsRef.current, { lat: loc.coords.latitude, lng: loc.coords.longitude, t: loc.timestamp }];
        pointsRef.current = next;
        setPoints(next);
      }
    );
  };

  const stop = async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    const durationSec = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const activity: RunActivity = {
      id: `${habitId}-${Date.now()}`,
      habitId,
      date: todayKey(),
      durationSec,
      distanceKm: routeDistanceKm(pointsRef.current),
      route: pointsRef.current,
    };
    await saveRunActivity(activity);
    setFinished(activity);
    setPhase('summary');
  };

  const requestClose = () => {
    if (phase === 'tracking') {
      confirmAction('Abandonner la course ?', 'Le trajet en cours ne sera pas enregistré.', 'Abandonner', () => {
        subscriptionRef.current?.remove();
        navigation.goBack();
      });
      return;
    }
    navigation.goBack();
  };

  const distanceKm = routeDistanceKm(points);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={{ flex: 1, paddingTop: topInset + spacing.sm, paddingHorizontal: spacing.lg }}>
        <View style={styles.header}>
          <Text style={typography.display}>Course</Text>
          <Pressable onPress={requestClose} hitSlop={12} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Fermer">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {phase === 'idle' && (
          <View style={styles.centerFill}>
            <View style={[styles.startIconWrap, { backgroundColor: accent + '1A' }]}>
              <Ionicons name="flame" size={40} color={accent} />
            </View>
            <Text style={[typography.h2, { marginTop: spacing.lg, textAlign: 'center' }]}>Prêt à courir ?</Text>
            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xs, maxWidth: 260 }]}>
              Ta position sert uniquement à mesurer la distance et tracer le trajet de cette course.
            </Text>
            <Pressable onPress={start} style={[styles.startBtn, { backgroundColor: accent }]} accessibilityRole="button" accessibilityLabel="Démarrer ma course">
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startBtnText}>Démarrer ma course</Text>
            </Pressable>
          </View>
        )}

        {phase === 'denied' && (
          <View style={styles.centerFill}>
            <Ionicons name="location-outline" size={40} color={colors.textTertiary} />
            <Text style={[typography.h2, { marginTop: spacing.lg, textAlign: 'center' }]}>Localisation refusée</Text>
            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xs, maxWidth: 260 }]}>
              Autorise l'accès à ta position dans les réglages pour suivre tes courses.
            </Text>
            <Pressable onPress={start} style={[styles.startBtn, { backgroundColor: accent }]}>
              <Text style={styles.startBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {phase === 'tracking' && (
          <View style={{ flex: 1 }}>
            <View style={styles.liveStatsRow}>
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatValue, { color: accent }]}>{formatDuration(elapsedSec)}</Text>
                <Text style={typography.caption}>Temps</Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatValue, { color: accent }]}>{distanceKm.toFixed(2)}</Text>
                <Text style={typography.caption}>km</Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatValue, { color: accent }]}>{formatPace(distanceKm, elapsedSec)}</Text>
                <Text style={typography.caption}>Allure</Text>
              </View>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <RouteMap route={points} height={260} color={accent} />
            </View>

            <View style={{ flex: 1 }} />

            <Pressable onPress={stop} style={styles.stopBtn} accessibilityRole="button" accessibilityLabel="Terminer la course">
              <Ionicons name="square" size={18} color="#fff" />
              <Text style={styles.startBtnText}>Terminer</Text>
            </Pressable>
          </View>
        )}

        {phase === 'summary' && finished && (
          <View style={{ flex: 1 }}>
            <View style={styles.liveStatsRow}>
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatValue, { color: accent }]}>{finished.distanceKm.toFixed(2)}</Text>
                <Text style={typography.caption}>km</Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatValue, { color: accent }]}>{formatDuration(finished.durationSec)}</Text>
                <Text style={typography.caption}>Temps</Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatValue, { color: accent }]}>{formatPace(finished.distanceKm, finished.durationSec)}</Text>
                <Text style={typography.caption}>Allure</Text>
              </View>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <RouteMap route={finished.route} height={260} color={accent} />
            </View>

            <View style={{ flex: 1 }} />

            <Pressable onPress={() => navigation.goBack()} style={[styles.startBtn, { backgroundColor: accent }]}>
              <Text style={styles.startBtnText}>Terminé</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing.xxl },
    startIconWrap: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
    startBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      marginTop: spacing.xl,
    },
    startBtnText: { color: '#fff', fontFamily: typography.bodyBold.fontFamily, fontSize: 16 },
    liveStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md },
    liveStat: { alignItems: 'center' },
    liveStatValue: { fontFamily: typography.display.fontFamily, fontSize: 28 },
    stopBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.danger,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      marginBottom: spacing.lg,
    },
  });
}
