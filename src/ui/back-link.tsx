import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { spacing, useTheme } from '@/core/theme';

import { Icon } from './icon';
import { Text } from './text';

/** "← label" link above a screen title. Goes back, or to `fallback` when there is no history. */
export function BackLink({ label, fallback }: { label: string; fallback: Href }) {
  const { colors } = useTheme();
  const back = () => (router.canGoBack() ? router.back() : router.replace(fallback));
  return (
    <Pressable accessibilityRole="button" onPress={back} hitSlop={8} style={styles.back}>
      <Icon name="arrow_back" ios="chevron.left" size={20} color={colors.primary} />
      <Text variant="label" color="primary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
});
