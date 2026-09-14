import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, AppState, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// Slow drifting light in the day's colour, behind everything else.
//
// A photographic "success" backdrop — a sunrise, a summit, someone running —
// would fight this app rather than dress it: the whole identity is true black,
// geometry and data, and a photo behind that reads as a screensaver. Generated
// motion says the same thing in the app's own language, weighs a few kilobytes,
// carries no licence, and turns green as the person gets further in.
//
// Three blobs with deliberately unrelated periods, so they never visibly sync
// into a pulse. Everything moves by transform only, which is the one thing the
// native driver can carry — the alternative, animating the gradient stops,
// would re-render SVG on the JS thread every frame.
type Blob = {
  size: number;
  x: [number, number];
  y: [number, number];
  scale: [number, number];
  duration: number;
  delay: number;
  opacity: number;
};

const BLOBS: Blob[] = [
  { size: 520, x: [-90, 40], y: [-60, 30], scale: [1, 1.18], duration: 17000, delay: 0, opacity: 0.68 },
  { size: 430, x: [140, 30], y: [180, 280], scale: [1.12, 0.92], duration: 23000, delay: 1400, opacity: 0.5 },
  { size: 360, x: [40, 170], y: [420, 330], scale: [0.9, 1.15], duration: 19000, delay: 800, opacity: 0.38 },
];

let instance = 0;

export function AmbientBackdrop({
  color,
  style,
  intensity = 1,
}: {
  color: string;
  style?: StyleProp<ViewStyle>;
  /** Scales every blob's opacity — 0 disables the effect without unmounting. */
  intensity?: number;
}) {
  const drift = useRef(BLOBS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const build = () => drift.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(BLOBS[i].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: BLOBS[i].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: BLOBS[i].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    let loops: Animated.CompositeAnimation[] = [];
    const start = () => { loops = build(); loops.forEach((l) => l.start()); };
    const stop = () => { loops.forEach((l) => l.stop()); loops = []; };

    start();
    // The loop has no natural end, so left alone it would keep the JS thread
    // awake behind a backgrounded PWA for as long as the tab lives. It costs
    // nothing measurable while visible — frame times were identical with it on
    // and off — but nothing is not the same as nothing while nobody is looking.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });

    return () => {
      subscription.remove();
      stop();
    };
  }, [drift]);

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }, style]}>
      {BLOBS.map((blob, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: blob.size,
            height: blob.size,
            opacity: blob.opacity * intensity,
            transform: [
              { translateX: drift[i].interpolate({ inputRange: [0, 1], outputRange: blob.x }) },
              { translateY: drift[i].interpolate({ inputRange: [0, 1], outputRange: blob.y }) },
              { scale: drift[i].interpolate({ inputRange: [0, 1], outputRange: blob.scale }) },
            ],
          }}
        >
          <Glow color={color} size={blob.size} />
        </Animated.View>
      ))}
    </View>
  );
}

function Glow({ color, size }: { color: string; size: number }) {
  // Gradient ids are global to the document on web, so several glows of
  // different colours on one screen would otherwise all take whichever was
  // defined last.
  const id = React.useMemo(() => `ambient${instance++}`, []);
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.46} />
          <Stop offset="55%" stopColor={color} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}
