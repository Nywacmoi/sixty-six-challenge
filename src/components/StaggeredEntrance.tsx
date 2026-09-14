import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

// A list that appears all at once reads as a screenshot; the same list arriving
// row by row reads as something being built for you. Forty-five milliseconds
// apart is the whole trick — fast enough that nobody waits, slow enough that
// the eye follows the order instead of taking the block in as one lump.
const STEP_MS = 45;
const DURATION_MS = 330;
const RISE = 14;
// Past this many rows the cascade would turn into a queue, so later items all
// share the last delay and simply fade in together.
const MAX_STEPS = 8;

export function StaggeredEntrance({
  index,
  children,
  style,
}: {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: DURATION_MS,
      delay: Math.min(index, MAX_STEPS) * STEP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // Deliberately mount-only: re-running this when the row's data changes
    // would make ticking a habit re-play its entrance.
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
