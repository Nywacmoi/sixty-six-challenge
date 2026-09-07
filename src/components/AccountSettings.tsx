import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSocial } from '../context/SocialContext';
import { useConfirm } from '../context/ConfirmContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { TRIAL_DAYS } from '../firebase/account';

type Mode = 'signup' | 'login';

export function AccountSettings() {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const { hasAccount, accountEmail, accountTrialDaysLeft, account, signUp, logIn, logOut, resetPassword } = useSocial();
  const { notify, confirmAction } = useConfirm();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (hasAccount) {
    const expired = account?.subscriptionStatus === 'expired';
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>{accountEmail}</Text>
            {account?.subscriptionStatus === 'trial' && (
              <Text style={[typography.caption, { marginTop: 2 }]}>
                Essai gratuit : encore {accountTrialDaysLeft} jour{accountTrialDaysLeft > 1 ? 's' : ''}
              </Text>
            )}
            {expired && (
              <Text style={[typography.caption, { color: colors.danger, marginTop: 2 }]}>
                Essai terminé — l'abonnement payant arrive bientôt.
              </Text>
            )}
          </View>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        </View>
        <Pressable
          style={styles.row}
          onPress={() =>
            confirmAction('Se déconnecter ?', 'Tu pourras te reconnecter avec ton email à tout moment.', 'Se déconnecter', logOut)
          }
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[typography.bodyBold, { color: colors.danger }]}>Se déconnecter</Text>
        </Pressable>
      </View>
    );
  }

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      if (mode === 'signup') await signUp(email.trim(), password);
      else await logIn(email.trim(), password);
      setEmail('');
      setPassword('');
    } catch (e: any) {
      notify('Impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      notify('Entre ton email', "Renseigne d'abord ton email ci-dessus, puis appuie de nouveau.");
      return;
    }
    try {
      await resetPassword(email.trim());
      notify('Email envoyé', 'Vérifie ta boîte mail pour réinitialiser ton mot de passe.');
    } catch (e: any) {
      notify('Impossible', e?.message ?? 'Réessaie dans un instant.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.tabBar}>
        <Pressable style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]} onPress={() => setMode('signup')}>
          <Text style={[typography.bodyBold, mode !== 'signup' && { color: colors.textSecondary }]}>Créer un compte</Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, mode === 'login' && styles.tabBtnActive]} onPress={() => setMode('login')}>
          <Text style={[typography.bodyBold, mode !== 'login' && { color: colors.textSecondary }]}>Se connecter</Text>
        </Pressable>
      </View>

      {mode === 'signup' && (
        <Text style={typography.caption}>
          {TRIAL_DAYS} jours d'essai gratuit, sans engagement. Tes amis et groupes actuels restent liés à ce compte.
        </Text>
      )}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        secureTextEntry
      />

      {mode === 'login' && (
        <Pressable onPress={forgotPassword}>
          <Text style={[typography.caption, { color: colors.accent }]}>Mot de passe oublié ?</Text>
        </Pressable>
      )}

      <Pressable style={[styles.submitBtn, (!email.trim() || !password || busy) && { opacity: 0.5 }]} onPress={submit} disabled={!email.trim() || !password || busy}>
        <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
          {busy ? 'Un instant…' : mode === 'signup' ? "Créer mon compte" : 'Se connecter'}
        </Text>
      </Pressable>
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
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.pill,
      padding: 4,
    },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
    tabBtnActive: { backgroundColor: colors.background },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.md,
      padding: spacing.md,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
  });
}
