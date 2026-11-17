import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '@/core/theme';
import { Text } from '@/ui';

/** "P19" in a small pale badge. */
export function RefBadge({ refName }: { refName: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.surfaceAccent }]}>
      <Text variant="label" color="link">
        {refName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
});
