import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { useTheme } from '@/core/theme';

/** Material Symbol on Android (and web), SF Symbol on iOS when given. */
export function Icon({ name, ios, size = 24, color }: { name: AndroidSymbol; ios?: SFSymbol; size?: number; color?: string }) {
  const { colors } = useTheme();
  return <SymbolView name={{ android: name, web: name, ios }} size={size} tintColor={color ?? colors.text} />;
}
