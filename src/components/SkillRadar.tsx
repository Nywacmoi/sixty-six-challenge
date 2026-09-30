import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../theme/theme';
import { Skill } from '../utils/skills';

// Five skills as one shape. A list of five levels says which numbers are
// bigger; a pentagon says what kind of person the check-ins are building —
// lopsided toward Corps, round and balanced, or barely a dot on day 3. Like
// the 99-grid, it's an image of the challenge that belongs to one person.
//
// Each axis runs from level 1 at the centre to level 10 at the rim. The
// shape keeps a small minimum so a brand-new tree is a visible seed rather
// than nothing at all.
const RINGS = [0.25, 0.5, 0.75, 1];
const MIN_VALUE = 0.06;
const LABEL_W = 90;

export function SkillRadar({ skills, width }: { skills: Skill[]; width: number }) {
  const { colors } = useTheme();
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
  }, [grow]);

  // Sized so the side labels, which sit furthest out horizontally, still
  // fit inside `width`: cos(18°) ≈ 0.951 is where the two side vertices land.
  const labelR = (width / 2 - LABEL_W / 2) / 0.951;
  const R = labelR - 28;
  const cx = width / 2;
  const cy = labelR + 18;
  const height = cy + labelR * 0.809 + 40;

  const n = skills.length;
  const at = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const ring = (f: number) => skills.map((_, i) => at(i, R * f)).map((p) => `${p.x},${p.y}`).join(' ');
  const value = (s: Skill) => Math.max(MIN_VALUE, Math.min(1, (s.level - 1 + s.progress) / 9));
  const shape = skills.map((s, i) => at(i, R * value(s)));

  return (
    <View style={{ width, height, alignSelf: 'center' }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {RINGS.map((f) => (
          <Polygon key={f} points={ring(f)} fill="none" stroke={colors.border} strokeWidth={1} />
        ))}
        {skills.map((s, i) => {
          const p = at(i, R);
          return <Line key={s.id} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth={1} />;
        })}
      </Svg>

      {/* Grows out of the centre once, the way the grid lays itself down. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: grow.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: grow }] }]}
      >
        <Svg width={width} height={height}>
          <Polygon
            points={shape.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={colors.accent + '2E'}
            stroke={colors.accent}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {shape.map((p, i) => (
            <Circle key={skills[i].id} cx={p.x} cy={p.y} r={4.5} fill={skills[i].color} stroke={colors.background} strokeWidth={1.5} />
          ))}
        </Svg>
      </Animated.View>

      {skills.map((s, i) => {
        const p = at(i, labelR);
        return (
          <View key={s.id} style={[styles.label, { left: p.x - LABEL_W / 2, top: p.y - 17 }]} pointerEvents="none">
            <Text style={[styles.name, { color: colors.text }]}>{s.label}</Text>
            <Text style={[styles.level, { color: s.color }]}>NIV. {s.level}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', width: LABEL_W, alignItems: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 12 },
  level: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, marginTop: 2 },
});
