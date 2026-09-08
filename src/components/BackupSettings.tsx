import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirm } from '../context/ConfirmContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';

export function BackupSettings() {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const { exportData, importData, showToast } = useApp();
  const { confirmAction, notify } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    const json = await exportData();
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      notify('Web uniquement', "L'export de sauvegarde est disponible sur la version web de l'appli.");
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `defi-99-sauvegarde-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('save', 'Sauvegarde téléchargée !');
  };

  const handlePickFile = () => {
    if (Platform.OS !== 'web') {
      notify('Web uniquement', 'La restauration de sauvegarde est disponible sur la version web de l\'appli.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChosen = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const json = String(reader.result ?? '');
      confirmAction(
        'Restaurer cette sauvegarde ?',
        'Toutes tes données actuelles (habitudes, historique, progression) seront remplacées par celles du fichier.',
        'Restaurer',
        async () => {
          setBusy(true);
          try {
            await importData(json);
            showToast('checkmark-circle', 'Sauvegarde restaurée !');
          } catch {
            notify('Fichier invalide', "Ce fichier ne semble pas être une sauvegarde valide de l'appli.");
          } finally {
            setBusy(false);
          }
        }
      );
    };
    reader.readAsText(file);
  };

  return (
    <View style={styles.card}>
      <Text style={typography.caption}>
        Tes données restent uniquement sur cet appareil. Exporte une sauvegarde régulièrement pour ne rien perdre si tu changes de téléphone ou vides le cache.
      </Text>
      <Pressable style={styles.row} onPress={handleExport} disabled={busy}>
        <Ionicons name="download-outline" size={20} color={colors.accent} />
        <Text style={[typography.bodyBold, { color: colors.accent }]}>Exporter mes données</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={handlePickFile} disabled={busy}>
        <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
        <Text style={typography.bodyBold}>Restaurer une sauvegarde</Text>
      </Pressable>

      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e: any) => {
            const file = e.target.files?.[0];
            if (file) handleFileChosen(file);
            e.target.value = '';
          }}
        />
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
      gap: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  });
}
