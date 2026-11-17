import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';
import { Text } from '@/ui';

import { formatMinutes, openPractice } from '../format';
import { SESSION_CONCLUSION, SESSION_INTRO, type PracticeStep, type ProgramWeek } from '@/core/program';

/** The week's "pratique assise type": intro, steps linking to the book, conclusion. */
export function SittingPractice({ week }: { week: ProgramWeek }) {
  const { t } = useTranslation();
  const { sitting } = week;
  return (
    <View style={styles.wrap}>
      <Part label={t('carnet.sittingIntro')} minutes={SESSION_INTRO.minutes}>
        <Step refs={[SESSION_INTRO.ref]} title={SESSION_INTRO.label} />
      </Part>
      <Part label={t('carnet.sittingMain')} minutes={sitting.mainMinutes}>
        {sitting.steps.map((step, i) => {
          const heading = step.group && step.group !== sitting.steps[i - 1]?.group ? step.group : null;
          return (
            <View key={i} style={styles.wrap}>
              {heading ? (
                <Text variant="label" color="heading">
                  {t(`carnet.groups.${heading}`).toUpperCase()}
                </Text>
              ) : null}
              <Step refs={step.refs} title={step.title} minutes={step.minutes} />
            </View>
          );
        })}
      </Part>
      <Part label={t('carnet.sittingConclusion')} minutes={SESSION_CONCLUSION.minutes}>
        <Step refs={[]} title={SESSION_CONCLUSION.label} />
      </Part>
      {sitting.note ? (
        <Text variant="small" color="textMuted">
          {sitting.note}
        </Text>
      ) : null}
    </View>
  );
}

function Part({ label, minutes, children }: { label: string; minutes: PracticeStep['minutes']; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <View style={styles.part}>
      <Text variant="label" color="textMuted">
        {`${label.toUpperCase()} · ${t('carnet.minutesShort', { n: formatMinutes(minutes) })}`}
      </Text>
      {children}
    </View>
  );
}

function Step({ refs, title, minutes }: { refs: readonly string[]; title: string; minutes?: PracticeStep['minutes'] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.step}>
      <View style={styles.refs}>
        {refs.map((ref, i) => (
          <View key={ref} style={styles.refRow}>
            {i > 0 ? (
              <Text variant="small" color="textMuted">
                {t('carnet.or')}
              </Text>
            ) : null}
            <RefLink refName={ref} />
          </View>
        ))}
      </View>
      <Text style={styles.grow}>
        {title}
        {minutes !== undefined ? (
          <Text color="textMuted">{` (${t('carnet.minutesShort', { n: formatMinutes(minutes) })})`}</Text>
        ) : null}
      </Text>
    </View>
  );
}

/** Badge opening the book section of a practice ("P10") or talk ("E6"). */
export function RefLink({ refName }: { refName: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openPractice(refName)}
      hitSlop={6}
      style={({ pressed }) => [styles.badge, { backgroundColor: colors.surfaceAccent }, pressed && { opacity: 0.7 }]}>
      <Text variant="label" color="link">
        {refName}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  part: { gap: spacing.sm, paddingTop: spacing.xs },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  refs: { gap: 2, minWidth: 44 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge: { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  grow: { flex: 1 },
});
