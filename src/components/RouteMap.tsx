import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/theme';
import { RunPoint } from '../types';
import { projectRoute } from '../utils/geo';

// No basemap tiles (react-native-maps doesn't run on web, and this app
// ships as a web PWA) — instead the real recorded GPS trace is projected
// onto a flat plane and drawn as a polyline. It's the actual route's
// shape, just without streets/terrain underneath.
export function RouteMap({ route, height = 160, color }: { route: RunPoint[]; height?: number; color?: string }) {
  const { colors } = useTheme();
  const strokeColor = color ?? colors.accent;
  const width = 320;

  if (route.length < 2) {
    return (
      <View style={[styles.empty, { height, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}>
        <Svg width={40} height={40} viewBox="0 0 40 40">
          <Circle cx={20} cy={20} r={4} fill={colors.textTertiary} />
        </Svg>
      </View>
    );
  }

  const points = projectRoute(route, width, height);
  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const last = points[points.length - 1];

  return (
    <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: radius.md, overflow: 'hidden' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <Polyline points={pointsAttr} fill="none" stroke={strokeColor} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={points[0].x} cy={points[0].y} r={4} fill={colors.text} />
        <Circle cx={last.x} cy={last.y} r={5} fill={strokeColor} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
});
