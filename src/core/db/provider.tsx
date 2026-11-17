import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import migrations from '@/drizzle/migrations';

import { db, prepareDatabase } from './client';

/** Opens the local database (asynchronously on web) and applies pending migrations before rendering the app. */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [opened, setOpened] = useState(() => db !== undefined);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (!opened) prepareDatabase().then(() => setOpened(true), setError);
  }, [opened]);
  if (error) return <DatabaseError error={error} />;
  return opened ? <Migrations>{children}</Migrations> : null;
}

function Migrations({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  useEffect(() => {
    if (success || error) SplashScreen.hideAsync();
  }, [success, error]);
  if (error) return <DatabaseError error={error} />;
  return success ? children : null;
}

function DatabaseError({ error }: { error: Error }) {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text>Erreur d’initialisation de la base locale : {error.message}</Text>
    </View>
  );
}
