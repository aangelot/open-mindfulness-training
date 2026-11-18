import '@/core/i18n';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { initOfflineAudio } from '@/core/audio/offline';
import { DatabaseProvider } from '@/core/db/provider';
import { initDayReminder } from '@/core/notifications/day-reminder';
import { DayReminderSync } from '@/core/notifications/day-reminder-sync';
import { colors, useTheme } from '@/core/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { scheme } = useTheme();
  useEffect(initOfflineAudio, []);
  useEffect(initDayReminder, []);
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: colors[scheme].primary, background: colors[scheme].background },
  };

  return (
    <ThemeProvider value={navTheme}>
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <DayReminderSync />
      </DatabaseProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
