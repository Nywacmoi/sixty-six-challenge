import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';

const CONFETTI_COLORS = ['#FFC542', '#58B7FF', '#3ECF5B', '#FFFFFF', '#FF8A5C'];
const PIECE_COUNT = 16;

type Piece = { dx: number; dy: number; rot: number; color: string; delay: number };

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 110;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 30,
      rot: Math.random() * 480 - 240,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 80,
    };
  });
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 950,
      delay: piece.delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: '46%',
        left: '50%',
        width: 7,
        height: 7,
        borderRadius: 2,
        backgroundColor: piece.color,
        opacity: progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.dx] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.dy] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.rot}deg`] }) },
        ],
      }}
    />
  );
}

// Fires once when today's checklist goes complete — a full-width banner
// drops from the top with a confetti burst, then clears itself. Purely a
// celebratory moment: no data, no persistence, `visible` is owned by the
// caller (goes true on the todayProgress 0→1 transition, false after).
export function PerfectDayCelebration({ visible, day }: { visible: boolean; day: number }) {
  const { colors, typography } = useTheme();
  const topInset = useTopInset();
  const styles = createStyles(colors, typography, topInset);
  const slide = useRef(new Animated.Value(0)).current;
  const piecesRef = useRef<Piece[]>([]);

  useEffect(() => {
    if (!visible) return;
    piecesRef.current = makePieces();
    slide.setValue(0);
    Animated.sequence([
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }),
      Animated.delay(2400),
      Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {piecesRef.current.map((p, i) => (
        <ConfettiPiece key={i} piece={p} />
      ))}
      <Animated.View
        style={[
          styles.banner,
          {
            opacity: slide,
            transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
          },
        ]}
      >
        <Ionicons name="sparkles" size={22} color="#05050a" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Jour parfait !</Text>
          <Text style={styles.subtitle}>Toutes les habitudes cochées — jour {day}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography, topInset: number) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      zIndex: 50,
    },
    banner: {
      position: 'absolute',
      top: topInset + spacing.sm,
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.gold,
      borderRadius: radius.md,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    title: { ...typography.bodyBold, color: '#05050a' },
    subtitle: { ...typography.small, color: '#402A00', marginTop: 1, textTransform: 'none', letterSpacing: 0 },
  });
}
