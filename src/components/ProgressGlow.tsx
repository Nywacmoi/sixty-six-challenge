import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// A soft radial wash behind the day's ring, in the day's colour. Drawn as an
// SVG gradient rather than a blurred View because CSS `filter: blur()` only
// exists on web — this renders identically on native.
// `style` lets a caller place the wash somewhere other than centred on a ring —
// a habit's screen hangs it off the top so its colour bleeds down behind the
// title instead of sitting around a number.
let instance = 0;

export function ProgressGlow({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  // Gradient ids are global to the document on web, so two glows of different
  // colours on one screen would otherwise both render whichever was defined last.
  const gradientId = React.useMemo(() => `progressGlow${instance++}`, []);

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}
