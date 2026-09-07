import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { CustomTabBar } from './CustomTabBar';
import OnboardingNavigator from './OnboardingNavigator';

import TodayScreen from '../screens/TodayScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SocialScreen from '../screens/SocialScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddHabitScreen from '../screens/AddHabitScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import ProgramScreen from '../screens/ProgramScreen';
import AssistantScreen from '../screens/AssistantScreen';
import GroupChatScreen from '../screens/GroupChatScreen';

const Tab = createBottomTabNavigator();
const TodayStack = createNativeStackNavigator();
const SocialStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function TodayStackNavigator() {
  return (
    <TodayStack.Navigator screenOptions={{ headerShown: false }}>
      <TodayStack.Screen name="TodayHome" component={TodayScreen} />
      <TodayStack.Screen name="HabitDetail" component={HabitDetailScreen} />
    </TodayStack.Navigator>
  );
}

function SocialStackNavigator() {
  return (
    <SocialStack.Navigator screenOptions={{ headerShown: false }}>
      <SocialStack.Screen name="SocialHome" component={SocialScreen} />
      <SocialStack.Screen name="GroupChat" component={GroupChatScreen} />
    </SocialStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="Today" component={TodayStackNavigator} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Social" component={SocialStackNavigator} />
      <Tab.Screen name="Achievements" component={AchievementsScreen} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// AddHabit vit au niveau racine (au-dessus des onglets) pour que la modale
// recouvre tout l'écran, y compris la barre d'onglets du bas — sinon celle-ci
// reste affichée sous la modale et grignote de la hauteur disponible.
function AppStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen name="AddHabit" component={AddHabitScreen} options={{ presentation: 'modal' }} />
      <RootStack.Screen name="Program" component={ProgramScreen} options={{ presentation: 'modal' }} />
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { mode, colors } = useTheme();
  const { profile, loading } = useApp();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      primary: colors.accent,
      text: colors.text,
    },
  };

  if (loading) return null;

  return (
    <NavigationContainer theme={navTheme}>
      {profile.onboardingCompleted ? <AppStack /> : <OnboardingNavigator />}
    </NavigationContainer>
  );
}
