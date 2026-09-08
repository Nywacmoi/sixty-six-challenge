import React, { useEffect, useState } from 'react';
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
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import { SocialProvider } from './src/context/SocialContext';
import RootNavigator from './src/navigation/RootNavigator';
import { LaunchScreen } from './src/components/LaunchScreen';
import { MorningCheckIn } from './src/components/MorningCheckIn';
import { todayKey } from './src/utils/date';

const LAUNCH_DURATION = 2500;

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
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), LAUNCH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded || !minTimeElapsed) {
    return <LaunchScreen duration={LAUNCH_DURATION} />;
  }

  const showCheckIn = !loading && profile.onboardingCompleted && profile.lastCheckInDate !== todayKey();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
      {showCheckIn && <MorningCheckIn />}
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
