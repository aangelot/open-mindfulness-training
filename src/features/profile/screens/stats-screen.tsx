import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { foundationSections, furtherSections, readingOrder, readingStatus, type SectionEntry } from '@/core/book/content';
import { cycleNumbers } from '@/core/cycle';
import { useCycles, type Cycle } from '@/core/cycle-store';
import { formatDuration } from '@/core/format';
import { OBSTACLES, REMINDER_SCALE } from '@/core/program';
import { spacing } from '@/core/theme';
import { BackLink, Card, Chip, ProgressBar, Screen, Text } from '@/ui';

import { PracticeCalendar, RatingBars, StatTiles, WeekBars } from '../components/charts';
import { calendarWeekCount, practiceCalendar, secondsByDay, streaks, topCounts, weeklyRatingAverages, weeklyTotals } from '../stats';
import { useAllDays, useCycleRatingList, useReadSectionIds, useSessionRefs } from '../store';

const WEEKS_IN_BARS = 12;
/** Minimum span of the calendar; it scrolls back to the first session. */
const WEEKS_IN_CALENDAR = 20;

export function StatsScreen() {
  const { t } = useTranslation();
  return (
    <Screen header={<BackLink label={t('profile.title')} fallback="/profil" />} title={t('profile.stats.title')}>
      <MeditationStats />
      <CarnetStats />
      <BookStats />
    </Screen>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="label" color="primary">
      {children.toUpperCase()}
    </Text>
  );
}

function MeditationStats() {
  const { t } = useTranslation();
  const { sessions, loaded } = useSessionRefs();
  const stats = useMemo(() => {
    const byDay = secondsByDay(sessions);
    return {
      total: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
      streaks: streaks(byDay),
      weeks: weeklyTotals(byDay, WEEKS_IN_BARS),
      calendar: practiceCalendar(byDay, calendarWeekCount(byDay, WEEKS_IN_CALENDAR)),
    };
  }, [sessions]);

  if (!loaded) return null;
  return (
    <Card>
      <SectionLabel>{t('profile.stats.meditation')}</SectionLabel>
      {sessions.length === 0 ? (
        <Text color="textMuted">{t('profile.stats.meditationEmpty')}</Text>
      ) : (
        <View style={styles.body}>
          <StatTiles
            tiles={[
              { value: formatDuration(stats.total), label: t('profile.stats.totalTime') },
              { value: String(sessions.length), label: t('profile.stats.sessions', { count: sessions.length }) },
              { value: t('profile.stats.days', { count: stats.streaks.current }), label: t('profile.stats.currentStreak') },
              { value: t('profile.stats.days', { count: stats.streaks.best }), label: t('profile.stats.bestStreak') },
            ]}
          />
          <Text variant="label" color="heading">
            {t('profile.stats.perWeek')}
          </Text>
          <WeekBars weeks={stats.weeks} />
          <Text variant="label" color="heading">
            {t('profile.stats.calendar')}
          </Text>
          <PracticeCalendar weeks={stats.calendar} />
        </View>
      )}
    </Card>
  );
}

function CarnetStats() {
  const { t } = useTranslation();
  const { cycles, loaded } = useCycles();
  const days = useAllDays();
  const numbers = useMemo(() => cycleNumbers(cycles), [cycles]);
  const defaultCycle = cycles.find((c) => c.status === 'active') ?? cycles[cycles.length - 1];
  const [chosenId, setChosenId] = useState<string | null>(null);
  const cycle = cycles.find((c) => c.id === chosenId) ?? defaultCycle;

  if (!loaded) return null;
  const completed = cycles.filter((c) => c.status === 'completed').length;
  const minutes = days.reduce((sum, d) => sum + (d.practiceMinutes ?? 0), 0);

  return (
    <Card>
      <SectionLabel>{t('profile.stats.carnet')}</SectionLabel>
      {cycles.length === 0 ? (
        <Text color="textMuted">{t('profile.stats.carnetEmpty')}</Text>
      ) : (
        <View style={styles.body}>
          <StatTiles
            tiles={[
              { value: String(days.length), label: t('profile.stats.daysFilled', { count: days.length }) },
              { value: String(completed), label: t('profile.stats.cyclesCompleted', { count: completed }) },
              { value: formatDuration(minutes * 60), label: t('profile.stats.carnetMinutes') },
            ]}
          />
          {cycles.length > 1 ? (
            <View style={styles.chips}>
              {cycles.map((c) => (
                <Chip
                  key={c.id}
                  label={t('carnet.cycle', { n: numbers.get(c.id) })}
                  selected={c.id === cycle?.id}
                  onPress={() => setChosenId(c.id)}
                />
              ))}
            </View>
          ) : null}
          {cycle ? <CycleDetail cycle={cycle} days={days.filter((d) => d.cycleId === cycle.id)} /> : null}
        </View>
      )}
    </Card>
  );
}

function CycleDetail({ cycle, days }: { cycle: Cycle; days: ReturnType<typeof useAllDays> }) {
  const { t } = useTranslation();
  const ratings = useCycleRatingList(cycle.id);
  const averages = useMemo(() => weeklyRatingAverages(ratings), [ratings]);
  const obstacles = useMemo(() => topCounts(days.map((d) => d.obstacleIds), 3), [days]);
  const obstacleLabel = (id: string) => OBSTACLES.find((o) => o.id === id)?.label ?? id;

  return (
    <View style={styles.body}>
      <Text variant="label" color="heading">
        {t('profile.stats.reminders')}
      </Text>
      {ratings.length === 0 ? (
        <Text variant="small" color="textMuted">
          {t('profile.stats.remindersEmpty')}
        </Text>
      ) : (
        <>
          <RatingBars averages={averages} />
          <Text variant="small" color="textMuted">
            {t('profile.stats.remindersScale', { a: REMINDER_SCALE.A.toLowerCase(), e: REMINDER_SCALE.E.toLowerCase() })}
          </Text>
        </>
      )}
      {obstacles.length > 0 ? (
        <>
          <Text variant="label" color="heading">
            {t('profile.stats.obstacles')}
          </Text>
          {obstacles.map((o) => (
            <View key={o.id} style={styles.row}>
              <Text style={styles.grow}>{obstacleLabel(o.id)}</Text>
              <Text variant="small" color="textMuted">
                {t('profile.stats.days', { count: o.count })}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

/** Chapter 3: the eight steps. With the foundations and what follows, every section is counted once. */
const stepEntries = readingOrder.filter((e) => e.part.chapter === 3);

function BookStats() {
  const { t } = useTranslation();
  const readIds = useReadSectionIds();
  const all = readingStatus(readingOrder, readIds);
  const rows: [string, readonly SectionEntry[]][] = [
    [t('journey.start.discover'), foundationSections],
    [t('profile.stats.eightSteps'), stepEntries],
    [t('journey.start.continue'), furtherSections],
  ];

  return (
    <Card>
      <SectionLabel>{t('profile.stats.book')}</SectionLabel>
      <View style={styles.body}>
        <Text>{t('journey.sectionsRead', { read: all.read, total: all.total })}</Text>
        <ProgressBar value={all.read / all.total} height={6} />
        {rows.map(([label, entries]) => {
          const status = readingStatus(entries, readIds);
          return (
            <View key={label} style={styles.bookRow}>
              <View style={styles.row}>
                <Text style={styles.grow}>{label}</Text>
                <Text variant="small" color="textMuted">
                  {status.read}/{status.total}
                </Text>
              </View>
              <ProgressBar value={status.read / status.total} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, marginTop: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  bookRow: { gap: spacing.xs },
});
