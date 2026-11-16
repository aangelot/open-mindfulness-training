import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '@/core/theme';

/** Thin horizontal bar, `value` between 0 and 1. */
export function ProgressBar({ value, height = 4 }: { value: number; height?: number }) {
  const { colors } = useTheme();
  const pct = `${Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10}%` as const;
  return (
    <View style={[styles.track, { height, backgroundColor: colors.border }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
