import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSocial } from '../context/SocialContext';
import { fonts, ThemeColors } from '../theme/theme';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';

// paddingTop(10) + icon(22) + gap(4) + label lineHeight(11) — the part of
// the bar's height that isn't the safe-area bottom inset. Screens with a
// fixed-at-bottom control (e.g. the chat input) need this to avoid sitting
// underneath the bar, since on web it's position:fixed and out of flow.
export const TAB_BAR_BASE_HEIGHT = 47;

const ICONS: Record<string, string> = {
  Today: 'today',
  Progress: 'stats-chart',
  Social: 'people',
  Achievements: 'trophy',
  Assistant: 'sparkles',
  Profile: 'person',
};

const ICONS_OUTLINE: Record<string, string> = {
  Today: 'today-outline',
  Progress: 'stats-chart-outline',
  Social: 'people-outline',
  Achievements: 'trophy-outline',
  Assistant: 'sparkles-outline',
  Profile: 'person-outline',
};

const LABELS: Record<string, string> = {
  Today: "Aujourd'hui",
  Progress: 'Progression',
  Social: 'Social',
  Achievements: 'Succès',
  Assistant: 'Aide',
  Profile: 'Profil',
};

export function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const bottomPadding = Math.max(insets.bottom, 14);
  const keyboardVisible = useKeyboardVisible();
  const { hasAnyUnread } = useSocial();

  if (keyboardVisible) return null;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const color = focused ? colors.accent : colors.textTertiary;
        const iconName = focused ? ICONS[route.name] : ICONS_OUTLINE[route.name];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={8}>
            <View>
              <Ionicons name={iconName as any} size={22} color={color} />
              {route.name === 'Social' && hasAnyUnread && <View style={styles.badge} />}
            </View>
            <Text style={[styles.label, { color }]} numberOfLines={2}>
              {LABELS[route.name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 10,
      // On web, pin the bar straight to the true bottom of the viewport
      // instead of relying on the flex column above it to add up to
      // exactly the right height — that chain has proven unreliable in
      // iOS Safari standalone, leaving a gap whose size shifts with how
      // much content the screen above happens to have.
      ...(Platform.OS === 'web'
        ? ({ position: 'fixed', bottom: 0, left: 0, right: 0 } as any)
        : null),
    } as any,
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      minHeight: 44,
    },
    label: {
      fontFamily: fonts.semiBold,
      fontSize: 9,
      lineHeight: 11,
      textAlign: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
    },
  });
}
