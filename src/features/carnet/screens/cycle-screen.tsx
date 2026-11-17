import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { openWeekPractice } from '@/core/links';
import { fontFamily, spacing, useTheme } from '@/core/theme';
import { BackLink, Button, Card, Icon, Screen, Text } from '@/ui';

import { confirmAbandon, confirmDelete, confirmResume, confirmStartCycle } from '../actions';
import { FoundationsAdvice, ReadStepLink } from '../components/reading-links';
import { SittingPractice } from '../components/sitting-practice';
import { TodayCard } from '../components/today-card';
import { TOTAL_DAYS, currentWeek, cycleNumbers, daysOfWeek, filledDays, localDate } from '@/core/cycle';
import { formatDate, isoToLocalDate, openCycles, openWeek } from '../format';
import { PROGRAM, type ProgramWeek } from '@/core/program';
import { useCycleDays, useCycles, type Cycle, type DailyReport } from '../store';

/** Carnet tab: the active cycle, or an invitation to start one. */
export function CarnetHomeScreen() {
  const { t } = useTranslation();
  const { cycles, loaded } = useCycles();
  if (!loaded) return <Screen title={t('carnet.title')} />;
  const active = cycles.find((c) => c.status === 'active');
  if (active) return <CycleView cycle={active} number={cycleNumbers(cycles).get(active.id) ?? 1} home />;

  return (
    <Screen title={t('carnet.title')}>
      <Text>{t('carnet.intro')}</Text>
      <Text color="textMuted">{t('carnet.introCycles')}</Text>
      <FoundationsAdvice />
      <Button label={t('carnet.start')} icon="play_arrow" iosIcon="play.fill" onPress={() => confirmStartCycle(null)} />
      {cycles.length > 0 ? <HistoryLink /> : null}
      <Text variant="label" color="textMuted" style={styles.sectionTitle}>
        {t('carnet.weeks').toUpperCase()}
      </Text>
      {PROGRAM.map((week) => (
        <Card key={week.week}>
          <Text variant="label" color="primary">
            {t('carnet.week', { n: week.week }).toUpperCase()}
          </Text>
          <Text variant="subtitle">{week.title}</Text>
        </Card>
      ))}
    </Screen>
  );
}

/** Any cycle by id (from "Mes cycles"). */
export function CycleScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const { cycles, loaded } = useCycles();
  const cycle = cycles.find((c) => c.id === id);
  if (!loaded) return <Screen />;
  if (!cycle) {
    return (
      <Screen header={<BackLink label={t('common.back')} fallback="/carnet" />}>
        <Text>{t('carnet.cycleNotFound')}</Text>
      </Screen>
    );
  }
  return <CycleView cycle={cycle} number={cycleNumbers(cycles).get(cycle.id) ?? 1} />;
}

function CycleView({ cycle, number, home }: { cycle: Cycle; number: number; home?: boolean }) {
  const { t } = useTranslation();
  const { cycles } = useCycles();
  const { days, loaded } = useCycleDays(cycle.id);
  const active = cycle.status === 'active';
  const otherActive = cycles.find((c) => c.status === 'active' && c.id !== cycle.id);
  const week = active ? currentWeek(days, localDate()) : null;

  const when = cycle.endedAt
    ? t('carnet.period', { start: formatDate(cycle.startDate), end: formatDate(isoToLocalDate(cycle.endedAt)) })
    : t('carnet.startedOn', { date: formatDate(cycle.startDate) });

  return (
    <Screen
      header={home ? undefined : <BackLink label={t('carnet.history')} fallback="/carnet/cycles" />}
      title={home ? t('carnet.title') : t('carnet.cycle', { n: number })}
      subtitle={`${home ? t('carnet.cycle', { n: number }) : t(`carnet.status.${cycle.status}`)} · ${when}`}>
      {active ? (
        <TodayCard cycle={cycle} number={number} />
      ) : (
        <Card>
          <Text color="textMuted">
            {t('carnet.readOnly', { status: t(`carnet.status.${cycle.status}`).toLowerCase() })}{' '}
            {t('carnet.daysFilled', { count: filledDays(days), total: TOTAL_DAYS })}
          </Text>
          {cycle.status === 'abandoned' ? (
            <Button
              label={t('carnet.resume')}
              icon="play_arrow"
              iosIcon="play.fill"
              onPress={() => {
                confirmResume(cycle.id, otherActive ? (cycleNumbers(cycles).get(otherActive.id) ?? null) : null, () =>
                  router.dismissTo('/carnet'),
                );
              }}
            />
          ) : null}
        </Card>
      )}

      {week !== null ? <CurrentWeekCard week={PROGRAM[week - 1]} /> : null}

      <Text variant="label" color="textMuted" style={styles.sectionTitle}>
        {t('carnet.weeks').toUpperCase()}
      </Text>
      {loaded ? PROGRAM.map((w) => <WeekRow key={w.week} cycleId={cycle.id} week={w} days={days} current={w.week === week} />) : null}

      <View style={styles.actions}>
        {home ? <HistoryLink /> : null}
        {active ? (
          <Button label={t('carnet.abandon')} variant="secondary" onPress={() => confirmAbandon(cycle.id)} />
        ) : (
          <Button
            label={t('carnet.deleteCycle')}
            variant="secondary"
            icon="delete"
            iosIcon="trash"
            onPress={() => confirmDelete(cycle.id, () => router.back())}
          />
        )}
      </View>
    </Screen>
  );
}

function CurrentWeekCard({ week }: { week: ProgramWeek }) {
  const { t } = useTranslation();
  return (
    <Card>
      <Text variant="label" color="primary">
        {`${t('carnet.week', { n: week.week })} · ${t('carnet.sitting')}`.toUpperCase()}
      </Text>
      <Text variant="subtitle">{week.title}</Text>
      <View style={styles.weekBody}>
        <ReadStepLink week={week.week} />
        <SittingPractice week={week} />
        <Button
          label={t('journey.week.practiceGuided')}
          icon="self_improvement"
          iosIcon="figure.mind.and.body"
          onPress={() => openWeekPractice(week.week)}
        />
      </View>
    </Card>
  );
}

function WeekRow({ cycleId, week, days, current }: { cycleId: string; week: ProgramWeek; days: readonly DailyReport[]; current: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const indexes = new Set(daysOfWeek(week.week));
  const inWeek = days.filter((d) => indexes.has(d.dayIndex));
  const minutes = inWeek.reduce((sum, d) => sum + (d.practiceMinutes ?? 0), 0);
  return (
    <Card onPress={() => openWeek(cycleId, week.week)}>
      <View style={styles.row}>
        <View style={styles.grow}>
          <Text variant="label" color={current ? 'primary' : 'textMuted'}>
            {t('carnet.week', { n: week.week }).toUpperCase()}
          </Text>
          <Text variant="body" style={styles.weekTitle}>
            {week.title}
          </Text>
          <Text variant="small" color="textMuted">
            {inWeek.length > 0 ? t('carnet.weekSummary', { days: inWeek.length, minutes }) : t('carnet.weekNotStarted')}
          </Text>
        </View>
        {inWeek.length === 7 ? <Icon name="check_circle" ios="checkmark.circle.fill" color={colors.primary} /> : null}
        <Icon name="chevron_right" ios="chevron.right" color={colors.textMuted} />
      </View>
    </Card>
  );
}

function HistoryLink() {
  const { t } = useTranslation();
  return <Button label={t('carnet.history')} variant="secondary" icon="history" iosIcon="clock.arrow.circlepath" onPress={openCycles} />;
}

const styles = StyleSheet.create({
  sectionTitle: { marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1, gap: 2 },
  weekTitle: { fontFamily: fontFamily(600), fontWeight: '600' },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  weekBody: { gap: spacing.md, marginTop: spacing.xs },
});
