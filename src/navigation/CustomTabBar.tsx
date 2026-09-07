import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts, ThemeColors } from '../theme/theme';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';

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

export function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const bottomPadding = Math.max(insets.bottom, 14);
  const keyboardVisible = useKeyboardVisible();

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
            <Ionicons name={iconName as any} size={22} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
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
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      minHeight: 44,
    },
    label: {
      fontFamily: fonts.semiBold,
      fontSize: 10.5,
      textAlign: 'center',
    },
  });
}
