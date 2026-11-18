import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/core/theme';

import { Icon } from './icon';
import { Text } from './text';

/**
 * Pressable row of a settings-like list: icon, label, optional detail, then a chevron
 * (`external`: an "open in new" icon, for links leaving the app).
 */
export function ListRow({
  label,
  detail,
  icon,
  ios,
  onPress,
  external,
  last,
}: {
  label: string;
  detail?: string;
  icon: AndroidSymbol;
  ios?: SFSymbol;
  onPress: () => void;
  external?: boolean;
  /** No separator under the last row of a group. */
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={external ? 'link' : 'button'}
      onPress={onPress}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}>
      <Icon name={icon} ios={ios} size={22} color={colors.primary} />
      <View style={styles.text}>
        <Text>{label}</Text>
        {detail ? (
          <Text variant="small" color="textMuted">
            {detail}
          </Text>
        ) : null}
      </View>
      {external ? (
        <Icon name="open_in_new" ios="arrow.up.right.square" size={18} color={colors.textMuted} />
      ) : (
        <Icon name="chevron_right" ios="chevron.right" size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52, paddingVertical: spacing.sm },
  text: { flex: 1, gap: 2 },
});
