import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// A soft radial wash behind the day's ring, in the day's colour. Drawn as an
// SVG gradient rather than a blurred View because CSS `filter: blur()` only
// exists on web — this renders identically on native.
export function ProgressGlow({ color, size }: { color: string; size: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="progressGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} fill="url(#progressGlow)" />
      </Svg>
    </View>
  );
}
