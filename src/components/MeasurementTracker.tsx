import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { MetricEntry } from '../types';

function Sparkline({ history, color, textColor }: { history: MetricEntry[]; color: string; textColor: string }) {
  const width = 240;
  const height = 48;
  if (history.length < 2) {
    return (
      <View style={{ width, height, justifyContent: 'center' }}>
        <Svg width={width} height={height}>
          <Line x1={4} y1={height / 2} x2={width - 4} y2={height / 2} stroke={color + '33'} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" />
          {history.length === 1 && <Circle cx={width - 4} cy={height / 2} r={3.5} fill={color} />}
        </Svg>
        <Text style={{ fontSize: 11, color: textColor, marginTop: 4 }}>
          {history.length === 0 ? 'Ta courbe de progression apparaîtra ici' : 'Encore une mesure pour tracer la tendance'}
        </Text>
      </View>
    );
  }
  const values = history.map((h) => h.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = history
    .map((h, i) => {
      const x = (i / (history.length - 1)) * (width - 8) + 4;
      const y = height - 6 - ((h.value - min) / range) * (height - 12);
      return `${x},${y}`;
    })
    .join(' ');
  const lastX = ((history.length - 1) / (history.length - 1)) * (width - 8) + 4;
  const lastY = height - 6 - ((values[values.length - 1] - min) / range) * (height - 12);

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={lastX} cy={lastY} r={3.5} fill={color} />
    </Svg>
  );
}

export function MeasurementTracker({
  title,
  subtitle,
  icon = 'analytics-outline',
  metricKey,
  unit,
  goal,
  extraInfo,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  metricKey: string;
  unit: string;
  goal?: number | null;
  extraInfo?: string;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const { logMetric, getMetricHistory, getLatestMetric } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const history = getMetricHistory(metricKey);
  const latest = getLatestMetric(metricKey);
  const first = history.length > 0 ? history[0].value : undefined;
  const delta = latest !== undefined && first !== undefined ? latest - first : undefined;

  const startEditing = () => {
    setDraft(latest !== undefined ? String(latest) : '');
    setEditing(true);
  };

  const save = async () => {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed > 0) {
      await logMetric(metricKey, parsed);
    }
    setEditing(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={[styles.iconBadge, { backgroundColor: colors.accent + '1A' }]}>
            <Ionicons name={icon} size={15} color={colors.accent} />
          </View>
          <View>
            <Text style={typography.bodyBold}>{title}</Text>
            {subtitle && <Text style={typography.small}>{subtitle}</Text>}
          </View>
        </View>
        {!editing && (
          <Pressable onPress={startEditing} style={styles.editBtn} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
            <Text style={[typography.small, { color: colors.accent }]}>Noter aujourd'hui</Text>
          </Pressable>
        )}
      </View>

      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            keyboardType="decimal-pad"
            placeholder={`ex. 72.5`}
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoFocus
            onSubmitEditing={save}
          />
          <Text style={typography.caption}>{unit}</Text>
          <Pressable onPress={save} style={styles.saveBtn}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.valueRow}>
            <Text style={typography.display}>{latest !== undefined ? latest : '—'}</Text>
            <Text style={[typography.caption, { marginLeft: 4 }]}>{unit}</Text>
            {delta !== undefined && delta !== 0 && (
              <View style={[styles.deltaPill, { backgroundColor: (delta < 0 ? colors.success : colors.accent) + '1F' }]}>
                <Ionicons name={delta < 0 ? 'trending-down' : 'trending-up'} size={12} color={delta < 0 ? colors.success : colors.accent} />
                <Text style={[typography.small, { color: delta < 0 ? colors.success : colors.accent }]}>
                  {delta > 0 ? '+' : ''}
                  {delta.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          {goal != null && (
            <Text style={typography.caption}>Objectif : {goal}{unit}</Text>
          )}
          {extraInfo && <Text style={typography.caption}>{extraInfo}</Text>}
          <View style={{ marginTop: spacing.sm }}>
            <Sparkline history={history} color={colors.accent} textColor={colors.textTertiary} />
          </View>
        </>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconBadge: {
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xs },
    deltaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: spacing.sm,
      marginBottom: 4,
    },
    editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
      color: colors.text,
      fontSize: 16,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
