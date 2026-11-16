import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, useTheme } from '@/core/theme';

import { Text } from './text';

/** Standard scrollable page with an optional title. */
export function Screen({ title, subtitle, children }: { title?: string; subtitle?: string; children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {title ? (
          <View style={styles.header}>
            <Text variant="title" color="heading">
              {title}
            </Text>
            {subtitle ? <Text color="textMuted">{subtitle}</Text> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
});
