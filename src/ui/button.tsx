import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';

import { Icon } from './icon';
import { Text } from './text';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: AndroidSymbol;
  iosIcon?: SFSymbol;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', icon, iosIcon, disabled }: ButtonProps) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  const fg = primary ? colors.onPrimary : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: primary ? colors.link : colors.border }}
      style={({ pressed }) => [
        styles.button,
        primary ? { backgroundColor: colors.primary } : { borderColor: colors.primary, borderWidth: 1 },
        (pressed || disabled) && { opacity: disabled ? 0.5 : 0.85 },
      ]}>
      {icon ? <Icon name={icon} ios={iosIcon} size={20} color={fg} /> : null}
      <Text variant="label" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
