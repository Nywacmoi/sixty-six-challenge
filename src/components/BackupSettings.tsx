import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirm } from '../context/ConfirmContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { useSocial } from '../context/SocialContext';
import {
  BackupStatus,
  overwriteCloudWithThisPhone,
  restoreCloudBackup,
  useBackupStatus,
} from '../firebase/backup';

function ago(at: number): string {
  const min = Math.round((Date.now() - at) / 60_000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `le ${new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

// What the automatic backup is doing, in one line. The card used to say
// "Tes données restent uniquement sur cet appareil" — true at the time, and
// the reason this exists.
function statusLine(status: BackupStatus, hasAccount: boolean): string {
  switch (status.state) {
    case 'off':
      return 'Sauvegarde automatique : connexion en cours…';
    case 'saving':
      return 'Sauvegarde en cours…';
    case 'saved':
      return (
        `Sauvegardé automatiquement ${ago(status.at)}. ` +
        (hasAccount
          ? 'Récupérable sur n’importe quel téléphone en te connectant.'
          : 'Crée un compte pour pouvoir le récupérer sur un autre téléphone.')
      );
    case 'conflict':
      return (
        `Ton compte a déjà une sauvegarde (${plural(status.cloud.habits, 'habitude')}, ` +
        `${plural(status.cloud.checkIns, 'check-in')}). Rien n’est écrasé tant que tu n’as pas choisi.`
      );
    case 'denied':
      return 'Sauvegarde automatique indisponible pour le moment (accès refusé par le serveur).';
    case 'error':
      return `Sauvegarde automatique en pause. ${status.message}`;
  }
}

export function BackupSettings() {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const { exportData, importData, showToast } = useApp();
  const { confirmAction, notify } = useConfirm();
  const { hasAccount } = useSocial();
  const status = useBackupStatus();
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
    showToast('save', 'Sauvegarde téléchargée !');
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
        'Restaurer cette sauvegarde ?',
        'Toutes tes données actuelles (habitudes, historique, progression) seront remplacées par celles du fichier.',
        'Restaurer',
        async () => {
          setBusy(true);
          try {
            await importData(json);
            showToast('checkmark-circle', 'Sauvegarde restaurée !');
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
      <View style={styles.statusRow}>
        <Ionicons
          name={status.state === 'saved' ? 'cloud-done-outline' : status.state === 'conflict' ? 'alert-circle-outline' : 'cloud-outline'}
          size={18}
          color={status.state === 'saved' ? colors.success : colors.textSecondary}
        />
        <Text style={[typography.caption, { flex: 1 }]}>{statusLine(status, hasAccount)}</Text>
      </View>

      {status.state === 'conflict' && (
        <>
          <Pressable style={styles.row} onPress={() => restoreCloudBackup()} disabled={busy}>
            <Ionicons name="cloud-download-outline" size={20} color={colors.accent} />
            <Text style={[typography.bodyBold, { color: colors.accent }]}>Restaurer la sauvegarde du compte</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            disabled={busy}
            onPress={() =>
              confirmAction(
                'Remplacer la sauvegarde\u202f?',
                `La sauvegarde du compte (${plural(status.cloud.habits, 'habitude')}, ${plural(status.cloud.checkIns, 'check-in')}) sera remplacée par les données de ce téléphone. C’est définitif.`,
                'Remplacer',
                () => overwriteCloudWithThisPhone()
              )
            }
          >
            <Ionicons name="phone-portrait-outline" size={20} color={colors.danger} />
            <Text style={[typography.bodyBold, { color: colors.danger }]}>Garder ce téléphone</Text>
          </Pressable>
        </>
      )}

      <Text style={typography.caption}>
        Les photos restent sur ce téléphone. Pour les garder aussi, exporte un fichier de temps en temps.
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
    statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  });
}
