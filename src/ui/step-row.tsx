import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { fontFamily, spacing, useTheme } from '@/core/theme';

import { Icon } from './icon';
import { ProgressBar } from './progress-bar';
import { Text } from './text';

const DOT = 28;

/**
 * One step of a path: a numbered dot (a check once done) joined to the next step by a line,
 * a title, a detail and optional progress. `current` highlights the step to do now.
 */
export function StepRow({
  index,
  title,
  detail,
  progress,
  done,
  current,
  last,
  onPress,
  children,
}: {
  index: number;
  title: string;
  detail?: string;
  /** 0–1, shown as a thin bar under the detail. */
  progress?: number;
  done?: boolean;
  current?: boolean;
  last?: boolean;
  onPress?: () => void;
  /** Extra content under the detail (e.g. a button for the current step). */
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const accent = done || current ? colors.primary : colors.textMuted;
  const header = (
    <>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: done && !current ? colors.textMuted : colors.text }]}>{title}</Text>
        {onPress ? <Icon name="chevron_right" ios="chevron.right" size={20} color={colors.textMuted} /> : null}
      </View>
      {detail ? (
        <Text variant="small" color="textMuted">
          {detail}
        </Text>
      ) : null}
      {progress !== undefined && !done ? <ProgressBar value={progress} /> : null}
    </>
  );
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        {done ? (
          <Icon name="check_circle" ios="checkmark.circle.fill" size={DOT} color={colors.primary} />
        ) : (
          <View
            style={[
              styles.dot,
              current ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border },
            ]}>
            <Text variant="label" style={{ color: current ? colors.onPrimary : accent }}>
              {index}
            </Text>
          </View>
        )}
        {last ? null : <View style={[styles.line, { backgroundColor: done ? colors.primary : colors.border }]} />}
      </View>
      <View style={[styles.content, !last && styles.spaced]}>
        {onPress ? (
          // Only the text is pressable: `children` may hold a button, which cannot sit inside another one.
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ checked: done }}
            onPress={onPress}
            android_ripple={{ color: colors.border }}
            style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}>
            {header}
          </Pressable>
        ) : (
          <View style={styles.header}>{header}</View>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: DOT },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 2, marginVertical: 4, minHeight: spacing.sm },
  content: { flex: 1, gap: spacing.sm, paddingTop: 2 },
  header: { gap: spacing.xs },
  spaced: { paddingBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontFamily: fontFamily(600), fontWeight: '600' },
});
