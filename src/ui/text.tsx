import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { fontFamily, typography, useTheme, type ThemeColors } from '@/core/theme';

type Variant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: keyof ThemeColors;
}

const weightOf = (v: Variant) => Number(typography[v].fontWeight) as 400 | 600;

export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      style={[typography[variant], { fontFamily: fontFamily(weightOf(variant)), color: colors[color] }, style]}
      {...rest}
    />
  );
}
