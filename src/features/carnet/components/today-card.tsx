import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme';
import { Button, Card, ProgressBar, Text } from '@/ui';

import { completeCycle } from '../actions';
import { TOTAL_DAYS, currentDayIndex, dayInWeek, filledDays, localDate, programWeek, weekOf } from '@/core/cycle';
import { openDay } from '../format';
import { useCycleDays, type Cycle } from '../store';

/** Where the active cycle stands today, with the button to fill the day. */
export function TodayCard({ cycle, number, showCycle }: { cycle: Cycle; number: number; showCycle?: boolean }) {
  const { t } = useTranslation();
  const { days, loaded } = useCycleDays(cycle.id);
  if (!loaded) return null;
  const today = localDate();
  const day = currentDayIndex(days, today);
  const filled = filledDays(days);
  const startedToday = day !== null && days.some((d) => d.dayIndex === day);

  return (
    <Card>
      <Text variant="label" color="primary">
        {(showCycle ? `${t('carnet.cycle', { n: number })} · ${t('carnet.todayCard')}` : t('carnet.todayCard')).toUpperCase()}
      </Text>
      {day === null ? (
        <View style={styles.body}>
          <Text>{t('carnet.allFilled')}</Text>
          <Button label={t('carnet.complete')} icon="check" iosIcon="checkmark" onPress={() => completeCycle(cycle.id)} />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.titles}>
            <Text variant="subtitle">{t('carnet.dayOf', { day: day + 1, total: TOTAL_DAYS })}</Text>
            <Text color="textMuted">
              {`${t('carnet.dayWeek', { week: weekOf(day), day: dayInWeek(day) })} — ${programWeek(weekOf(day)).title}`}
            </Text>
          </View>
          <ProgressBar value={filled / TOTAL_DAYS} />
          <Button
            label={t(startedToday ? 'carnet.editDay' : 'carnet.fillDay', { n: day + 1 })}
            icon="edit_note"
            iosIcon="square.and.pencil"
            onPress={() => openDay(cycle.id, day)}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  titles: { gap: 2 },
});
