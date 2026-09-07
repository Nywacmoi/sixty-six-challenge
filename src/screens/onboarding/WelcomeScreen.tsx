import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, TOTAL_DAYS, ThemeColors, Typography } from '../../theme/theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StepDots } from '../../components/StepDots';

export default function WelcomeScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.content}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[typography.display, { textAlign: 'center', marginTop: spacing.xl }]}>
          Bienvenue dans{'\n'}Défi 99
        </Text>
        <Text style={[typography.body, { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.md }]}>
          92% abandonnent leurs objectifs. 8% ont un système.{'\n'}Construis le tien en {TOTAL_DAYS} jours.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        <StepDots total={3} activeIndex={0} />
        <PrimaryButton
          label="Commencer"
          onPress={() => navigation.navigate('Name')}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    logo: { width: 120, height: 120 },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
  });
}
