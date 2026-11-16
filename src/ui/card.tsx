import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';

export function Card({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const { colors } = useTheme();
  const style = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];
  if (!onPress) return <View style={style}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [style, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.xs },
});
