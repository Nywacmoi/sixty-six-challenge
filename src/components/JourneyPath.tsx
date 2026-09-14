import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { AVATAR_MILESTONES } from '../data/avatarItems';
import { AppIcon } from './AppIcon';

// A Duolingo-style winding lesson path, built from the same milestone data
// as AvatarProgress (so a node here always matches a real wardrobe unlock).
// Each big bubble is a milestone; the avatar floats next to whichever one
// is the current tier, the way Duolingo's bird sits by the active lesson.
const ROW_HEIGHT = 104;
const TRACK_WIDTH = 220;
const AMPLITUDE = 68;
const NODE_SIZE = 56;
const VIEWPORT_HEIGHT = 420;

function xForIndex(i: number) {
  return TRACK_WIDTH / 2 + AMPLITUDE * Math.sin((i * Math.PI) / 2.1);
}

type NodeState = 'done' | 'current' | 'locked';

function MilestoneNode({
  day,
  caption,
  index,
  x,
  y,
  state,
  styles,
  colors,
}: {
  day: number;
  caption: string;
  index: number;
  x: number;
  y: number;
  state: NodeState;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, delay: index * 90, friction: 6, tension: 80, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (state !== 'current') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [state]);

  const icon = state === 'locked' ? 'lock-closed' : state === 'current' ? 'flame' : 'checkmark';
  const iconColor = state === 'locked' ? colors.textTertiary : '#fff';
  const bg = state === 'locked' ? colors.surfaceElevated : colors.accent;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - NODE_SIZE / 2,
        top: y - NODE_SIZE / 2,
        alignItems: 'center',
        opacity: enter,
        transform: [{ scale: Animated.multiply(enter, state === 'current' ? pulse : 1) }],
      }}
    >
      {state === 'current' && <View style={styles.glow} pointerEvents="none" />}
      <View style={[styles.node, { backgroundColor: bg }, state === 'locked' && styles.nodeLocked]}>
        <AppIcon name={icon} size={state === 'locked' ? 18 : 22} color={iconColor} />
      </View>
      <Text style={[styles.nodeDay, state === 'locked' && { color: colors.textTertiary }]}>J{day}</Text>
      {state === 'current' && (
        <Text style={styles.nodeCaption} numberOfLines={2}>
          {caption}
        </Text>
      )}
    </Animated.View>
  );
}

export function JourneyPath({ currentDay, avatar }: { currentDay: number; avatar: React.ReactNode }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const scrollRef = useRef<ScrollView>(null);

  const nodes = AVATAR_MILESTONES.map((m, i) => ({ day: m.day, caption: m.caption, x: xForIndex(i), y: i * ROW_HEIGHT + 44 }));
  const currentIdx = (() => {
    for (let i = nodes.length - 1; i >= 0; i--) if (currentDay >= nodes[i].day) return i;
    return 0;
  })();
  const totalHeight = nodes.length * ROW_HEIGHT + 60;

  useEffect(() => {
    const targetY = Math.max(0, nodes[currentIdx].y - VIEWPORT_HEIGHT / 2);
    const id = setTimeout(() => scrollRef.current?.scrollTo({ y: targetY, animated: true }), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  return (
    <View style={styles.viewport}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={{ height: totalHeight, alignSelf: 'center', width: TRACK_WIDTH + 140 }}>
          <Svg width={TRACK_WIDTH + 140} height={totalHeight} style={StyleSheet.absoluteFill}>
            {nodes.slice(0, -1).map((n, i) => {
              const next = nodes[i + 1];
              const done = currentDay >= next.day;
              return (
                <Line
                  key={n.day}
                  x1={n.x + 70}
                  y1={n.y}
                  x2={next.x + 70}
                  y2={next.y}
                  stroke={done ? colors.accent : colors.border}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray="2 14"
                />
              );
            })}
          </Svg>

          {nodes.map((n, i) => {
            const state: NodeState = currentDay < n.day ? 'locked' : i === currentIdx ? 'current' : 'done';
            return (
              <MilestoneNode
                key={n.day}
                day={n.day}
                caption={n.caption}
                index={i}
                x={n.x + 70}
                y={n.y}
                state={state}
                styles={styles}
                colors={colors}
              />
            );
          })}

          <View
            style={{
              position: 'absolute',
              left: nodes[currentIdx].x + 70 + (nodes[currentIdx].x < TRACK_WIDTH / 2 ? NODE_SIZE : -NODE_SIZE - 48),
              top: nodes[currentIdx].y - 36,
            }}
          >
            {avatar}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    viewport: {
      height: VIEWPORT_HEIGHT,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    node: {
      width: NODE_SIZE,
      height: NODE_SIZE,
      borderRadius: NODE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    nodeLocked: { borderWidth: 1.5, borderColor: colors.border },
    glow: {
      position: 'absolute',
      width: NODE_SIZE + 20,
      height: NODE_SIZE + 20,
      borderRadius: (NODE_SIZE + 20) / 2,
      backgroundColor: colors.accent,
      opacity: 0.22,
      top: -10,
    },
    nodeDay: { ...typography.small, marginTop: 4, fontFamily: typography.bodyBold.fontFamily, color: colors.text },
    nodeCaption: {
      ...typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      width: 120,
      marginTop: 2,
    },
  });
}
