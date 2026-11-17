import { Pressable, StyleSheet } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';

import { Text } from './text';

/** Toggleable pill. */
export function Chip({
  label,
  selected,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled || !onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.background, borderColor: colors.border },
        pressed && { opacity: 0.8 },
      ]}>
      <Text variant="small" style={{ color: selected ? colors.onPrimary : colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
