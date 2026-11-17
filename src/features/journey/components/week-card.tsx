import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useBookProgress } from '@/core/book/progress';
import { readingStatus, stepSections } from '@/core/book/content';
import { TOTAL_DAYS, currentDayIndex, currentWeek, filledDays, localDate, programWeek } from '@/core/cycle';
import type { ActiveCycle } from '@/core/cycle-store';
import { openBookSection, openCarnet, openCarnetDay, openWeekPractice } from '@/core/links';
import { spacing } from '@/core/theme';
import { Card, ProgressBar, StepRow, Text } from '@/ui';

import { useTodayPracticeSeconds } from '../store';

/** During a cycle, the three things to do this week: read the step, practise, write in the carnet. */
export function WeekCard({ active }: { active: ActiveCycle }) {
  const { t } = useTranslation();
  const { readIds } = useBookProgress();
  const practiced = useTodayPracticeSeconds();
  const { cycle, number, days } = active;
  const today = localDate();
  const day = currentDayIndex(days, today);
  const week = currentWeek(days, today);
  const step = readingStatus(stepSections(week), readIds);
  const noted = day !== null && days.some((d) => d.dayIndex === day);

  return (
    <Card>
      <Text variant="label" color="primary">
        {t('journey.week.label', { cycle: number, week }).toUpperCase()}
      </Text>
      <Text variant="subtitle">{programWeek(week).title}</Text>
      <View style={styles.progress}>
        <ProgressBar value={filledDays(days) / TOTAL_DAYS} />
        <Text variant="small" color="textMuted">
          {t('journey.week.days', { count: filledDays(days), total: TOTAL_DAYS })}
        </Text>
      </View>
      <View style={styles.steps}>
        <StepRow
          index={1}
          title={t('journey.week.read', { n: week })}
          detail={t('journey.sectionsRead', { read: step.read, total: step.total })}
          progress={step.read / step.total}
          done={step.done}
          current={!step.done}
          onPress={() => openBookSection(step.next.section.id)}
        />
        <StepRow
          index={2}
          title={t('journey.week.practice')}
          detail={
            practiced > 0
              ? t('journey.week.practicedToday', { minutes: Math.max(1, Math.round(practiced / 60)) })
              : t('journey.week.practiceHint')
          }
          done={practiced > 0}
          current={practiced === 0}
          onPress={() => openWeekPractice(week)}
        />
        <StepRow
          index={3}
          title={t('journey.week.note')}
          detail={
            day === null
              ? t('journey.week.allFilled')
              : t(noted ? 'journey.week.notedToday' : 'journey.week.noteHint', { n: day + 1 })
          }
          done={noted}
          current={!noted}
          last
          onPress={() => (day === null ? openCarnet() : openCarnetDay(cycle.id, day))}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  progress: { gap: spacing.xs },
  steps: { marginTop: spacing.sm },
});
