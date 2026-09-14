import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import { SocialProvider } from './src/context/SocialContext';
import RootNavigator from './src/navigation/RootNavigator';
import { LaunchScreen } from './src/components/LaunchScreen';
import { MorningCheckIn } from './src/components/MorningCheckIn';
import { StatusBarScrim } from './src/components/StatusBarScrim';
import { isCheckInDue } from './src/utils/checkIn';

// Long enough for the grid to sweep in and land, and not a millisecond more.
// The previous 2500 was a hold on an app that had already finished loading —
// a tax paid on every open, several times a day, for ninety-nine days.
const LAUNCH_DURATION = 1400;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function AppShell() {
  const { mode, colors } = useTheme();
  const { loading, profile } = useApp();
  const [fontsLoaded] = useFonts({
    Anton_400Regular,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const ready = fontsLoaded && minTimeElapsed;

  // The launch screen used to be swapped out with a bare `return`: everything
  // before it was animated, everything after it was animated, and between the
  // two the screen jumped. It now stays on top and dissolves while the app
  // mounts underneath, so the ring starts filling and the rows start arriving
  // inside the same movement rather than after a cut.
  const [handingOff, setHandingOff] = useState(true);
  const launchFade = useRef(new Animated.Value(1)).current;
  const handoff = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), LAUNCH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // The short delay lets the app's own entrances get under way behind the
    // cover, so what emerges is already in motion.
    handoff.current = Animated.timing(launchFade, {
      toValue: 0,
      duration: 460,
      delay: 90,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    handoff.current.start(({ finished }) => {
      if (finished) setHandingOff(false);
    });
  }, [ready, launchFade]);

  useEffect(() => () => handoff.current?.stop(), []);

  if (!ready) {
    return <LaunchScreen duration={LAUNCH_DURATION} />;
  }

  const showCheckIn = isCheckInDue(profile, loading);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
      {showCheckIn && <MorningCheckIn />}
      {/* Last, so it masks the status bar for the navigator and any overlay
          above it alike — see StatusBarScrim for why it's needed at all. */}
      <StatusBarScrim />

      {handingOff && (
        <Animated.View
          pointerEvents="none"
          // Above the check-in overlay, which carries zIndex 200 and would
          // otherwise paint over a later sibling that has none.
          style={[StyleSheet.absoluteFill, { opacity: launchFade, zIndex: 300 }]}
        >
          {/* Frozen: this is the same screen the person is already looking at,
              not a new one. Replaying its entrance while it dissolves would
              read as a flicker. */}
          <LaunchScreen duration={LAUNCH_DURATION} frozen />
        </Animated.View>
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ConfirmProvider>
          <AppProvider>
            <SocialProvider>
              <AppShell />
            </SocialProvider>
          </AppProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
