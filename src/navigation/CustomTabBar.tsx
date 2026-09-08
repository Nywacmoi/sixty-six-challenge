import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSocial } from '../context/SocialContext';
import { fonts, ThemeColors } from '../theme/theme';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';

// wrap paddingTop(6) + pill paddingVertical(10*2) + tab item content
// (icon 22 + gap 3 + label ~10, with its own 6*2 padding) ≈ the part of the
// bar's height that isn't the safe-area bottom inset. Screens with a
// fixed-at-bottom control (e.g. the chat input) need this to avoid sitting
// underneath the bar, since on web it's position:fixed and out of flow.
export const TAB_BAR_BASE_HEIGHT = 78;

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
  const { colors, mode } = useTheme();
  const styles = createStyles(colors);
  const bottomPadding = Math.max(insets.bottom, 14);
  const keyboardVisible = useKeyboardVisible();
  const { hasAnyUnread } = useSocial();

  if (keyboardVisible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: bottomPadding }]}>
      <View style={styles.pill}>
        {Platform.OS === 'web' ? (
          <View style={styles.webGlass} />
        ) : (
          <>
            <BlurView
              intensity={mode === 'dark' ? 55 : 65}
              tint={mode === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface + '4D' }]} />
          </>
        )}
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
              <View style={[styles.tabInner, focused && { backgroundColor: colors.accent + '26' }]}>
                <View>
                  <Ionicons name={iconName as any} size={20} color={color} />
                  {route.name === 'Social' && hasAnyUnread && <View style={styles.badge} />}
                </View>
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {LABELS[route.name]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      paddingTop: 6,
      paddingHorizontal: 14,
      backgroundColor: 'transparent',
      // On web, pin the bar straight to the true bottom of the viewport
      // instead of relying on the flex column above it to add up to
      // exactly the right height — that chain has proven unreliable in
      // iOS Safari standalone, leaving a gap whose size shifts with how
      // much content the screen above happens to have.
      ...(Platform.OS === 'web'
        ? ({ position: 'fixed', bottom: 0, left: 0, right: 0 } as any)
        : null),
    } as any,
    pill: {
      flex: 1,
      flexDirection: 'row',
      borderRadius: 26,
      paddingVertical: 10,
      paddingHorizontal: 6,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    // react-native-web forwards unrecognised style keys straight to the DOM
    // node, so backdropFilter works here even though it's not a real RN
    // style prop — same trick as the position:'fixed' cast above. expo-blur
    // has only limited web support, hence the separate branch.
    webGlass: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface + 'CC',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } as any,
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabInner: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 18,
      minWidth: 44,
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
