import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { fontFamily, radius, spacing, typography, useTheme } from '@/core/theme';

import { Text } from './text';

/** Labelled text input; multiline by default (journal entries). */
export function TextField({ label, multiline = true, style, ...rest }: TextInputProps & { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" color="textMuted">
          {label}
        </Text>
      ) : null}
      <TextInput
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        style={[
          styles.input,
          typography.body,
          { fontFamily: fontFamily(400), color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.sm },
  multiline: { minHeight: 72 },
});
