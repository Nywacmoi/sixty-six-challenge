import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AvatarDisplay } from './AvatarDisplay';
import { Profile } from '../types';
import { spacing, radius, ThemeColors, Typography } from '../theme/theme';

export const CARD_WIDTH = 320;
export const CARD_HEIGHT = 568;

// Purpose-built for export via react-native-view-shot — not a screenshot of
// the recap screen itself, a separate, denser layout designed to read well
// as a standalone image (Instagram Stories etc), with the app's own
// branding baked in so it's recognizable wherever it lands.
export const ShareCard = forwardRef<
  View,
  {
    profile: Profile;
    currentDay: number;
    checkIns: number;
    perfectDays: number;
    bestStreak: number;
    colors: ThemeColors;
    typography: Typography;
  }
>(({ profile, currentDay, checkIns, perfectDays, bestStreak, colors, typography }, ref) => {
  const styles = createStyles(colors, typography);

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <LinearGradient colors={[colors.accent, colors.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />

      <View style={styles.brandRow}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandText}>DÉFI 99</Text>
      </View>

      <View style={styles.avatarWrap}>
        <AvatarDisplay
          color={profile.avatarColor}
          seed={profile.avatarSeed}
          gender={profile.avatarGender}
          hair={profile.avatarHair}
          accessory={profile.avatarAccessory}
          facialHair={profile.avatarFacialHair}
          expression={profile.avatarExpression}
          hasAura={currentDay >= 75}
          hasStar={currentDay >= 99}
          size={104}
        />
      </View>

      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.day}>Jour {currentDay} sur 99</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{checkIns}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{perfectDays}/7</Text>
          <Text style={styles.statLabel}>Jours parfaits</Text>
        </View>
        <View style={styles.stat}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="flame" size={16} color="#FFFFFF" />
            <Text style={styles.statValue}>{bestStreak}</Text>
          </View>
          <Text style={styles.statLabel}>Meilleure série</Text>
        </View>
      </View>

      <Text style={styles.tagline}>99 jours pour construire ta discipline</Text>
    </View>
  );
});

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: radius.lg,
      overflow: 'hidden',
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#00000022',
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
    logo: { width: 36, height: 36 * (428 / 1107) },
    brandText: {
      fontFamily: typography.bodyBold.fontFamily,
      fontSize: 13,
      letterSpacing: 1,
      color: '#FFFFFF',
    },
    avatarWrap: {
      marginTop: spacing.xl,
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: '#FFFFFF33',
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      marginTop: spacing.lg,
      fontFamily: typography.display.fontFamily,
      fontSize: 24,
      color: '#FFFFFF',
    },
    day: {
      marginTop: 2,
      fontFamily: typography.caption.fontFamily,
      fontSize: 14,
      color: '#FFFFFFCC',
    },
    statsRow: {
      flexDirection: 'row',
      marginTop: spacing.xxl,
      backgroundColor: '#FFFFFF1F',
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      width: '100%',
    },
    stat: { flex: 1, alignItems: 'center', gap: 3 },
    statValue: {
      fontFamily: typography.h1.fontFamily,
      fontSize: 20,
      color: '#FFFFFF',
    },
    statLabel: {
      fontFamily: typography.small.fontFamily,
      fontSize: 10,
      color: '#FFFFFFCC',
      textAlign: 'center',
    },
    tagline: {
      marginTop: 'auto',
      fontFamily: typography.caption.fontFamily,
      fontSize: 12,
      color: '#FFFFFFCC',
      textAlign: 'center',
    },
  });
}
