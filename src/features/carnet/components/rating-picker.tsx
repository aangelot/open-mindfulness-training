import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';
import { Text } from '@/ui';

import { REMINDER_SCALE, type ReminderRating } from '@/core/program';

const LETTERS = Object.keys(REMINDER_SCALE) as ReminderRating[];

/** A–E self-assessment. Tapping the selected letter clears it. */
export function RatingPicker({
  value,
  onChange,
  disabled,
}: {
  value: ReminderRating | undefined;
  onChange: (rating: ReminderRating | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {LETTERS.map((letter) => {
        const selected = value === letter;
        return (
          <Pressable
            key={letter}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={t('carnet.reminders.rating', { letter, label: REMINDER_SCALE[letter] })}
            disabled={disabled}
            onPress={() => onChange(selected ? null : letter)}
            style={({ pressed }) => [
              styles.cell,
              selected
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.background, borderColor: colors.border },
              pressed && { opacity: 0.8 },
              disabled && !selected && { opacity: 0.5 },
            ]}>
            <Text variant="label" style={{ color: selected ? colors.onPrimary : colors.text }}>
              {letter}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
  },
});
