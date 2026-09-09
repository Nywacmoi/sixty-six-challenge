import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSocial } from '../context/SocialContext';
import { fonts, ThemeColors } from '../theme/theme';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';

// wrap paddingTop(6) + pill height(54), plus a little slack for the active
// tab's capsule poking up above the pill's own top edge ≈ the part of the
// bar's height that isn't the safe-area bottom inset. Screens with a
// fixed-at-bottom control (e.g. the chat input) need this to avoid sitting
// underneath the bar, since on web it's position:fixed and out of flow.
export const TAB_BAR_BASE_HEIGHT = 76;

const ICONS: Record<string, string> = {
  Today: 'today',
  Progress: 'stats-chart',
  Social: 'people',
  Achievements: 'trophy',
  Profile: 'person',
};

const ICONS_OUTLINE: Record<string, string> = {
  Today: 'today-outline',
  Progress: 'stats-chart-outline',
  Social: 'people-outline',
  Achievements: 'trophy-outline',
  Profile: 'person-outline',
};

const LABELS: Record<string, string> = {
  Today: "Aujourd'hui",
  Progress: 'Progression',
  Social: 'Social',
  Achievements: 'Succès',
  Profile: 'Profil',
};

type TabLayout = { x: number; width: number };

export function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const styles = createStyles(colors);
  const bottomPadding = Math.max(insets.bottom, 14);
  const keyboardVisible = useKeyboardVisible();
  const { hasAnyUnread } = useSocial();

  // The raised capsule is one shared Animated.View that slides/squishes to
  // whichever tab is active, instead of each tab independently toggling its
  // own background — that's what makes switching tabs feel like one piece
  // of material moving, not five buttons snapping on and off.
  const layouts = useRef<Record<number, TabLayout>>({});
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const squish = useRef(new Animated.Value(1)).current;
  const [indicatorReady, setIndicatorReady] = useState(false);

  const moveIndicator = (index: number, animate: boolean) => {
    const layout = layouts.current[index];
    if (!layout) return;
    if (animate) {
      Animated.parallel([
        Animated.spring(indicatorX, { toValue: layout.x, useNativeDriver: false, friction: 9, tension: 70 }),
        Animated.spring(indicatorWidth, { toValue: layout.width, useNativeDriver: false, friction: 9, tension: 70 }),
        Animated.sequence([
          Animated.timing(squish, { toValue: 1.18, duration: 110, useNativeDriver: false }),
          Animated.spring(squish, { toValue: 1, useNativeDriver: false, friction: 5, tension: 120 }),
        ]),
      ]).start();
    } else {
      indicatorX.setValue(layout.x);
      indicatorWidth.setValue(layout.width);
      setIndicatorReady(true);
    }
  };

  const handleTabLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[index] = { x, width };
    if (index === state.index && !indicatorReady) moveIndicator(index, false);
  };

  if (keyboardVisible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: bottomPadding }]}>
      <View style={styles.pill}>
        {/* Separate clipped layer just for the blur/glass background — the
            outer `pill` itself stays overflow:'visible' so the active tab's
            capsule can poke up past the bar's own top edge. */}
        <View style={styles.pillBg} pointerEvents="none">
          {Platform.OS === 'web' ? (
            <View style={styles.webGlass} />
          ) : (
            <>
              <BlurView
                intensity={mode === 'dark' ? 55 : 65}
                tint={mode === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface + '14' }]} />
            </>
          )}
        </View>

        {indicatorReady && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                backgroundColor: colors.background + 'F2',
                borderColor: colors.border,
                width: indicatorWidth,
                transform: [{ translateX: indicatorX }, { scaleX: squish }],
              },
            ]}
          />
        )}

        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const color = focused ? colors.accent : colors.textTertiary;
          const iconName = focused ? ICONS[route.name] : ICONS_OUTLINE[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
              moveIndicator(index, true);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLayout={handleTabLayout(index)}
              style={styles.tab}
              hitSlop={8}
              tabIndex={-1}
            >
              <View style={[styles.tabInner, focused && styles.tabInnerActive]}>
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
      height: 54,
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderRadius: 26,
      paddingHorizontal: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    pillBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 26,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    // react-native-web forwards unrecognised style keys straight to the DOM
    // node, so backdropFilter works here even though it's not a real RN
    // style prop — same trick as the position:'fixed' cast above. expo-blur
    // has only limited web support, hence the separate branch. Saturating
    // the blur is what makes it read as "glass" rather than just "frosted
    // gray" — it's the standard iOS-style glassmorphism recipe.
    webGlass: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface + '1F',
      backdropFilter: 'blur(18px) saturate(200%)',
      WebkitBackdropFilter: 'blur(18px) saturate(200%)',
    } as any,
    // The shared capsule that slides between tabs — same footprint as the
    // old per-tab `tabInnerActive`, just owned by one Animated.View instead
    // of toggled on whichever tab happens to be focused.
    indicator: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 66,
      borderRadius: 28,
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
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
    // Taller than the pill's own padding allows, so it pokes up past the
    // bar's top edge instead of just tinting in place — the "raised chip"
    // look from the reference the user sent, not a flush highlight. The
    // background itself now lives on the shared `indicator` above; this
    // just keeps the active tab's own icon/label sized to match its footprint.
    tabInnerActive: {
      paddingVertical: 16,
      paddingHorizontal: 14,
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
