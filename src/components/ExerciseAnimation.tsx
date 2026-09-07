import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type MovementPattern = 'push' | 'pull' | 'squat' | 'curl' | 'raise' | 'hold' | 'run' | 'crunch';

// Minimal schematic stick-figure loop per movement family — not a real
// demonstration video (we don't have rights to film/host one), just a quick
// visual cue of the movement direction. The YouTube button next to each
// exercise links to real technique videos for the exact move.

type Pt = [number, number];
type Limb = { joint: [Pt, Pt]; end: [Pt, Pt] };
type Equipment = 'dumbbells' | 'dumbbell' | 'barShoulders' | 'bar' | 'none';

type Pose = {
  headY: [number, number];
  hipY: [number, number];
  leftArm: Limb;
  rightArm: Limb;
  leftLeg: Limb;
  rightLeg: Limb;
  equipment: Equipment;
};

const STANDING_LEGS = {
  leftLeg: { joint: [[26, 48], [26, 48]] as [Pt, Pt], end: [[24, 58], [24, 58]] as [Pt, Pt] },
  rightLeg: { joint: [[38, 48], [38, 48]] as [Pt, Pt], end: [[40, 58], [40, 58]] as [Pt, Pt] },
};

const POSES: Record<Exclude<MovementPattern, 'hold'>, Pose> = {
  push: {
    headY: [16, 16],
    hipY: [40, 40],
    leftArm: {
      joint: [
        [22, 30],
        [20, 20],
      ],
      end: [
        [18, 34],
        [16, 10],
      ],
    },
    rightArm: {
      joint: [
        [42, 30],
        [44, 20],
      ],
      end: [
        [46, 34],
        [48, 10],
      ],
    },
    ...STANDING_LEGS,
    equipment: 'dumbbells',
  },
  pull: {
    headY: [16, 16],
    hipY: [40, 40],
    leftArm: {
      joint: [
        [18, 20],
        [22, 30],
      ],
      end: [
        [14, 12],
        [27, 33],
      ],
    },
    rightArm: {
      joint: [
        [46, 20],
        [42, 30],
      ],
      end: [
        [50, 12],
        [37, 33],
      ],
    },
    ...STANDING_LEGS,
    equipment: 'bar',
  },
  squat: {
    headY: [16, 27],
    hipY: [40, 47],
    leftArm: {
      joint: [
        [22, 32],
        [20, 38],
      ],
      end: [
        [24, 40],
        [18, 46],
      ],
    },
    rightArm: {
      joint: [
        [42, 32],
        [44, 38],
      ],
      end: [
        [40, 40],
        [46, 46],
      ],
    },
    leftLeg: {
      joint: [
        [26, 48],
        [17, 45],
      ],
      end: [
        [24, 58],
        [22, 58],
      ],
    },
    rightLeg: {
      joint: [
        [38, 48],
        [47, 45],
      ],
      end: [
        [40, 58],
        [42, 58],
      ],
    },
    equipment: 'barShoulders',
  },
  curl: {
    headY: [16, 16],
    hipY: [40, 40],
    leftArm: {
      joint: [
        [24, 38],
        [24, 38],
      ],
      end: [
        [24, 48],
        [27, 24],
      ],
    },
    rightArm: {
      joint: [
        [40, 38],
        [40, 38],
      ],
      end: [
        [40, 48],
        [37, 24],
      ],
    },
    ...STANDING_LEGS,
    equipment: 'dumbbells',
  },
  raise: {
    headY: [16, 16],
    hipY: [40, 40],
    leftArm: {
      joint: [
        [25, 40],
        [15, 27],
      ],
      end: [
        [26, 44],
        [9, 25],
      ],
    },
    rightArm: {
      joint: [
        [39, 40],
        [49, 27],
      ],
      end: [
        [38, 44],
        [55, 25],
      ],
    },
    ...STANDING_LEGS,
    equipment: 'dumbbells',
  },
  crunch: {
    headY: [32, 18],
    hipY: [46, 44],
    leftArm: {
      joint: [
        [26, 36],
        [26, 24],
      ],
      end: [
        [22, 42],
        [22, 18],
      ],
    },
    rightArm: {
      joint: [
        [38, 36],
        [38, 24],
      ],
      end: [
        [42, 42],
        [42, 18],
      ],
    },
    leftLeg: {
      joint: [
        [22, 46],
        [22, 46],
      ],
      end: [
        [16, 40],
        [16, 40],
      ],
    },
    rightLeg: {
      joint: [
        [42, 46],
        [42, 46],
      ],
      end: [
        [48, 40],
        [48, 40],
      ],
    },
    equipment: 'none',
  },
  run: {
    headY: [14, 11],
    hipY: [38, 36],
    leftArm: {
      joint: [
        [24, 26],
        [30, 20],
      ],
      end: [
        [30, 18],
        [22, 30],
      ],
    },
    rightArm: {
      joint: [
        [40, 20],
        [34, 26],
      ],
      end: [
        [32, 30],
        [42, 18],
      ],
    },
    leftLeg: {
      joint: [
        [28, 48],
        [36, 44],
      ],
      end: [
        [22, 56],
        [40, 50],
      ],
    },
    rightLeg: {
      joint: [
        [36, 44],
        [28, 48],
      ],
      end: [
        [40, 50],
        [22, 56],
      ],
    },
    equipment: 'none',
  },
};

function lerpPt(progress: Animated.Value, [a, b]: [Pt, Pt], axis: 0 | 1) {
  return progress.interpolate({ inputRange: [0, 1], outputRange: [a[axis], b[axis]] });
}

function LimbView({
  progress,
  anchorX,
  anchorY,
  limb,
  color,
}: {
  progress: Animated.Value;
  anchorX: number;
  anchorY: Animated.AnimatedInterpolation<number>;
  limb: Limb;
  color: string;
}) {
  const jointX = lerpPt(progress, limb.joint, 0);
  const jointY = lerpPt(progress, limb.joint, 1);
  const endX = lerpPt(progress, limb.end, 0);
  const endY = lerpPt(progress, limb.end, 1);
  return (
    <>
      <AnimatedLine x1={anchorX} y1={anchorY} x2={jointX} y2={jointY} stroke={color} strokeWidth={3.4} strokeLinecap="round" />
      <AnimatedLine x1={jointX} y1={jointY} x2={endX} y2={endY} stroke={color} strokeWidth={3.4} strokeLinecap="round" />
      <AnimatedCircle cx={jointX} cy={jointY} r={2} fill={color} />
      <AnimatedCircle cx={endX} cy={endY} r={2.4} fill={color} />
    </>
  );
}

function PlankFigure({ size, color, accent }: { size: number; color: string; accent: string }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const shake = bob.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Line x1={6} y1={54} x2={58} y2={54} stroke={color + '55'} strokeWidth={2} strokeLinecap="round" />
      <AnimatedCircle cx={14} cy={shake.interpolate({ inputRange: [0, 0.6], outputRange: [36, 35.4] })} r={6} fill={color} />
      <AnimatedLine
        x1={20}
        y1={shake.interpolate({ inputRange: [0, 0.6], outputRange: [38, 37.4] })}
        x2={50}
        y2={38}
        stroke={color}
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      <Line x1={22} y1={40} x2={16} y2={54} stroke={accent} strokeWidth={3.4} strokeLinecap="round" />
      <Line x1={50} y1={38} x2={56} y2={54} stroke={color} strokeWidth={3.4} strokeLinecap="round" />
    </Svg>
  );
}

export function ExerciseAnimation({ pattern, size = 56 }: { pattern: MovementPattern; size?: number }) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pattern === 'hold') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pattern]);

  if (pattern === 'hold') {
    return <PlankFigure size={size} color={colors.textSecondary} accent={colors.accent} />;
  }

  const pose = POSES[pattern];
  const headY = progress.interpolate({ inputRange: [0, 1], outputRange: pose.headY });
  const hipY = progress.interpolate({ inputRange: [0, 1], outputRange: pose.hipY });
  const shoulderY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [pose.headY[0] + 11, pose.headY[1] + 11],
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Line x1={4} y1={59} x2={60} y2={59} stroke={colors.textSecondary + '33'} strokeWidth={2} strokeLinecap="round" />

      {pose.equipment === 'barShoulders' && (
        <AnimatedLine
          x1={16}
          y1={progress.interpolate({ inputRange: [0, 1], outputRange: [pose.headY[0] + 9, pose.headY[1] + 9] })}
          x2={48}
          y2={progress.interpolate({ inputRange: [0, 1], outputRange: [pose.headY[0] + 9, pose.headY[1] + 9] })}
          stroke={colors.accent}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      {pose.equipment === 'bar' && (
        <AnimatedLine
          x1={lerpPt(progress, pose.leftArm.end, 0)}
          y1={lerpPt(progress, pose.leftArm.end, 1)}
          x2={lerpPt(progress, pose.rightArm.end, 0)}
          y2={lerpPt(progress, pose.rightArm.end, 1)}
          stroke={colors.accent}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}

      <LimbView progress={progress} anchorX={32} anchorY={hipY} limb={pose.leftLeg} color={colors.textSecondary} />
      <LimbView progress={progress} anchorX={32} anchorY={hipY} limb={pose.rightLeg} color={colors.textSecondary} />

      <AnimatedLine x1={32} y1={shoulderY} x2={32} y2={hipY} stroke={colors.textSecondary} strokeWidth={3.6} strokeLinecap="round" />
      <AnimatedCircle cx={32} cy={headY} r={6} fill={colors.textSecondary} />

      <LimbView progress={progress} anchorX={32} anchorY={shoulderY} limb={pose.leftArm} color={colors.accent} />
      <LimbView progress={progress} anchorX={32} anchorY={shoulderY} limb={pose.rightArm} color={colors.accent} />

      {(pose.equipment === 'dumbbells' || pose.equipment === 'dumbbell') && (
        <>
          <AnimatedCircle cx={lerpPt(progress, pose.leftArm.end, 0)} cy={lerpPt(progress, pose.leftArm.end, 1)} r={3} fill={colors.accent} stroke={colors.textSecondary} strokeWidth={1} />
          {pose.equipment === 'dumbbells' && (
            <AnimatedCircle cx={lerpPt(progress, pose.rightArm.end, 0)} cy={lerpPt(progress, pose.rightArm.end, 1)} r={3} fill={colors.accent} stroke={colors.textSecondary} strokeWidth={1} />
          )}
        </>
      )}
    </Svg>
  );
}
