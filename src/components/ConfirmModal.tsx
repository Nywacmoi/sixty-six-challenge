import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  isInfo,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  isInfo: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={typography.h2}>{title}</Text>
          <Text style={[typography.body, { marginTop: spacing.sm, color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.buttonRow}>
            {!isInfo && (
              <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                <Text style={typography.bodyBold}>Annuler</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.button, { backgroundColor: destructive ? colors.danger : colors.accent }]}
              onPress={onConfirm}
            >
              <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.sm + 4,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surfaceElevated,
    },
  });
}
