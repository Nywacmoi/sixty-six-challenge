import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing } from '../theme/theme';
import { RunPoint } from '../types';
import { buildTileLayout, projectRoute, TILE_SIZE } from '../utils/geo';
import { tileUrl, TILE_ATTRIBUTION, TILE_DIM_OPACITY } from '../config/mapTiles';

// Raster map tiles are plain <Image>s positioned in a grid, with the GPS
// trace drawn on top in SVG using the same Web Mercator projection — so
// this renders identically on native and web without react-native-maps
// (which has no web support, and this app also ships as a PWA).
export function RouteMap({ route, height = 160, color }: { route: RunPoint[]; height?: number; color?: string }) {
  const { colors } = useTheme();
  const strokeColor = color ?? colors.accent;
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (route.length < 2) {
    return (
      <View
        onLayout={onLayout}
        style={[styles.empty, { height, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}
      >
        <Svg width={40} height={40} viewBox="0 0 40 40">
          <Circle cx={20} cy={20} r={4} fill={colors.textTertiary} />
        </Svg>
      </View>
    );
  }

  const layout = width > 0 ? buildTileLayout(route, width, height) : null;

  // Until onLayout has reported a width there's no pixel space to place
  // tiles in — draw the trace alone rather than flashing an empty box.
  if (!layout) {
    const fallback = projectRoute(route, 320, height);
    return (
      <View
        onLayout={onLayout}
        style={{ height, backgroundColor: colors.surfaceElevated, borderRadius: radius.md, overflow: 'hidden' }}
      >
        <Svg width="100%" height={height} viewBox={`0 0 320 ${height}`} preserveAspectRatio="xMidYMid meet">
          <Polyline
            points={fallback.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={strokeColor}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  const { tiles, points } = layout;
  const last = points[points.length - 1];

  return (
    <View
      onLayout={onLayout}
      style={{ height, backgroundColor: colors.surfaceElevated, borderRadius: radius.md, overflow: 'hidden' }}
    >
      {tiles.map((t) => (
        <Image
          key={`${t.x}-${t.y}`}
          source={{ uri: tileUrl(layout.zoom, t.x, t.y) }}
          style={{ position: 'absolute', left: t.left, top: t.top, width: TILE_SIZE, height: TILE_SIZE }}
          fadeDuration={0}
        />
      ))}

      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${TILE_DIM_OPACITY})` }]} pointerEvents="none" />

      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Darker casing under the trace keeps it readable over busy map detail. */}
        <Polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={7}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={strokeColor}
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={points[0].x} cy={points[0].y} r={5} fill="#FFFFFF" stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
        <Circle cx={last.x} cy={last.y} r={6} fill={strokeColor} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
      </Svg>

      <Text style={styles.attribution}>{TILE_ATTRIBUTION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  attribution: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    fontSize: 9,
    color: 'rgba(255,255,255,0.65)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 4,
    borderRadius: spacing.xs,
  },
});
