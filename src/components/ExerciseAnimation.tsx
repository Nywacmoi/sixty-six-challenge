import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type MovementPattern = 'push' | 'pull' | 'squat' | 'curl' | 'raise' | 'hold' | 'run' | 'crunch';

// Minimal schematic stick-figure loop per movement family — not a real
// demonstration video (we don't have rights to film/host one), just a quick
// visual cue of the movement direction. The YouTube button next to it links
// to real technique videos for the exact exercise.
type Pose = {
  headY: [number, number];
  torsoY2: [number, number];
  leftArm: [[number, number], [number, number]];
  rightArm: [[number, number], [number, number]];
  leftLeg?: [[number, number], [number, number]];
  rightLeg?: [[number, number], [number, number]];
};

const POSES: Record<MovementPattern, Pose> = {
  push: {
    headY: [14, 14],
    torsoY2: [40, 40],
    leftArm: [
      [26, 30],
      [18, 16],
    ],
    rightArm: [
      [38, 30],
      [46, 16],
    ],
  },
  pull: {
    headY: [14, 14],
    torsoY2: [40, 40],
    leftArm: [
      [18, 16],
      [26, 30],
    ],
    rightArm: [
      [46, 16],
      [38, 30],
    ],
  },
  curl: {
    headY: [14, 14],
    torsoY2: [40, 40],
    leftArm: [
      [24, 44],
      [24, 22],
    ],
    rightArm: [
      [40, 44],
      [40, 22],
    ],
  },
  raise: {
    headY: [14, 14],
    torsoY2: [40, 40],
    leftArm: [
      [26, 40],
      [12, 22],
    ],
    rightArm: [
      [38, 40],
      [52, 22],
    ],
  },
  hold: {
    headY: [14, 15],
    torsoY2: [40, 40],
    leftArm: [
      [22, 34],
      [22, 34],
    ],
    rightArm: [
      [42, 34],
      [42, 34],
    ],
  },
  crunch: {
    headY: [30, 16],
    torsoY2: [42, 40],
    leftArm: [
      [26, 34],
      [26, 20],
    ],
    rightArm: [
      [38, 34],
      [38, 20],
    ],
    leftLeg: [
      [20, 52],
      [20, 52],
    ],
    rightLeg: [
      [44, 52],
      [44, 52],
    ],
  },
  squat: {
    headY: [14, 24],
    torsoY2: [40, 48],
    leftArm: [
      [22, 30],
      [22, 38],
    ],
    rightArm: [
      [42, 30],
      [42, 38],
    ],
  },
  run: {
    headY: [14, 12],
    torsoY2: [40, 38],
    leftArm: [
      [20, 30],
      [30, 20],
    ],
    rightArm: [
      [44, 20],
      [34, 30],
    ],
    leftLeg: [
      [22, 56],
      [34, 50],
    ],
    rightLeg: [
      [42, 50],
      [30, 56],
    ],
  },
};

export function ExerciseAnimation({ pattern, size = 56 }: { pattern: MovementPattern; size?: number }) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pattern]);

  const pose = POSES[pattern];
  const lerp = (range: [number, number]) => progress.interpolate({ inputRange: [0, 1], outputRange: range });
  const legs = pose.leftLeg && pose.rightLeg;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <AnimatedCircle cx={32} cy={lerp(pose.headY)} r={6} fill={colors.textSecondary} />
      <AnimatedLine
        x1={32}
        y1={lerp([pose.headY[0] + 6, pose.headY[1] + 6])}
        x2={32}
        y2={lerp(pose.torsoY2)}
        stroke={colors.textSecondary}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <AnimatedLine
        x1={32}
        y1={lerp([pose.headY[0] + 12, pose.headY[1] + 12])}
        x2={lerp([pose.leftArm[0][0], pose.leftArm[1][0]])}
        y2={lerp([pose.leftArm[0][1], pose.leftArm[1][1]])}
        stroke={colors.accent}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <AnimatedLine
        x1={32}
        y1={lerp([pose.headY[0] + 12, pose.headY[1] + 12])}
        x2={lerp([pose.rightArm[0][0], pose.rightArm[1][0]])}
        y2={lerp([pose.rightArm[0][1], pose.rightArm[1][1]])}
        stroke={colors.accent}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {legs && (
        <>
          <AnimatedLine
            x1={32}
            y1={lerp(pose.torsoY2)}
            x2={lerp([pose.leftLeg![0][0], pose.leftLeg![1][0]])}
            y2={lerp([pose.leftLeg![0][1], pose.leftLeg![1][1]])}
            stroke={colors.textSecondary}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <AnimatedLine
            x1={32}
            y1={lerp(pose.torsoY2)}
            x2={lerp([pose.rightLeg![0][0], pose.rightLeg![1][0]])}
            y2={lerp([pose.rightLeg![0][1], pose.rightLeg![1][1]])}
            stroke={colors.textSecondary}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </>
      )}
      {!legs && (
        <>
          <AnimatedLine x1={32} y1={lerp(pose.torsoY2)} x2={20} y2={58} stroke={colors.textSecondary} strokeWidth={3} strokeLinecap="round" />
          <AnimatedLine x1={32} y1={lerp(pose.torsoY2)} x2={44} y2={58} stroke={colors.textSecondary} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
