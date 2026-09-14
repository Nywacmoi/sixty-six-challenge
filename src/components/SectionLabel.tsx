import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../theme/theme';

// The quiet all-caps rule that separates blocks on a screen. Deliberately
// small and wide rather than a heading: on a true-black ground a bold h2
// competes with the content it's supposed to introduce, while this reads as
// a label on a piece of equipment.
export function SectionLabel({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        { fontFamily: fonts.bold, fontSize: 9.5, letterSpacing: 1.6, color: colors.textTertiary },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
