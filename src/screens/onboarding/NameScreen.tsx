import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, ThemeColors, Typography } from '../../theme/theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StepDots } from '../../components/StepDots';

export default function NameScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const topInset = Math.min(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 16);
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: topInset + spacing.sm }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={typography.display}>Comment on{'\n'}t'appelle ?</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Pour personnaliser ton expérience.
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ton prénom"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => navigation.navigate('Goal', { name: name.trim() })}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        <StepDots total={3} activeIndex={1} />
        <PrimaryButton
          label="Continuer"
          onPress={() => navigation.navigate('Goal', { name: name.trim() })}
          style={{ marginTop: spacing.lg }}
        />
        <Pressable onPress={() => navigation.navigate('Goal', { name: '' })} style={{ marginTop: spacing.md, alignSelf: 'center' }}>
          <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>Passer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
    input: {
      marginTop: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      color: colors.text,
      fontSize: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
  });
}
