import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import migrations from '@/drizzle/migrations';

import { db } from './client';

/** Applies pending migrations before rendering the app. */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  useEffect(() => {
    if (success || error) SplashScreen.hideAsync();
  }, [success, error]);
  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text>Erreur d’initialisation de la base locale : {error.message}</Text>
      </View>
    );
  }
  return success ? children : null;
}
