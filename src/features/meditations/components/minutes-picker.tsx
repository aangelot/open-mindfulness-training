import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme';
import { Chip, TextField } from '@/ui';

/**
 * Minutes as chips, with a field for any other value.
 * `value` is null while the field holds something that is not a valid number.
 */
export function MinutesPicker({
  options,
  value,
  onChange,
  customLabel,
  max,
}: {
  options: readonly number[];
  value: number | null;
  onChange: (minutes: number | null) => void;
  customLabel: string;
  max: number;
}) {
  const [custom, setCustom] = useState(() => (value !== null && !options.includes(value) ? String(value) : ''));
  const pick = (minutes: number) => {
    setCustom('');
    onChange(minutes);
  };
  const type = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setCustom(digits);
    const n = Number(digits);
    onChange(digits && n >= 1 && n <= max ? n : null);
  };
  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {options.map((m) => (
          <Chip key={m} label={`${m} min`} selected={custom === '' && value === m} onPress={() => pick(m)} />
        ))}
      </View>
      <TextField
        label={customLabel}
        multiline={false}
        keyboardType="number-pad"
        value={custom}
        onChangeText={type}
        maxLength={3}
        style={styles.field}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  field: { maxWidth: 140 },
});
