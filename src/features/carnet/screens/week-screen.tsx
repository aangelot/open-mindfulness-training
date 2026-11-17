import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';
import { BackLink, Card, Icon, Screen, Text } from '@/ui';

import { AutosaveField } from '../components/autosave-field';
import { SittingPractice } from '../components/sitting-practice';
import { currentDayIndex, dayInWeek, daysOfWeek, localDate, programWeek } from '../cycle';
import { formatShortDate, openDay } from '../format';
import { OBSTACLES, RECOMMENDED_DAYS_PER_WEEK, REMEDIES, type Reminder } from '../program';
import { ratingKey, setWeekNote, useCycleDays, useCycleRatings, useCycles, useWeekNotes, type DailyReport } from '../store';

const labelOf = (list: readonly { id: string; label: string }[], ids: readonly string[]) =>
  ids.map((id) => list.find((o) => o.id === id)?.label ?? id).join(', ');

/** One week of a cycle: the booklet's two tables (sitting reports, reminder ratings + observations). */
export function WeekScreen({ cycleId, week }: { cycleId: string; week: number }) {
  const { t } = useTranslation();
  const { cycles } = useCycles();
  const { days, loaded } = useCycleDays(cycleId);
  const ratings = useCycleRatings(cycleId);
  const { notes, loaded: notesLoaded } = useWeekNotes(cycleId, week);
  const cycle = cycles.find((c) => c.id === cycleId);
  const program = programWeek(week);
  const editable = cycle?.status === 'active';
  const indexes = daysOfWeek(week);
  const byIndex = new Map(days.map((d) => [d.dayIndex, d]));
  const today = editable && loaded ? currentDayIndex(days, localDate()) : null;
  const weekDays = indexes.map((i) => byIndex.get(i)).filter((d): d is DailyReport => d !== undefined);
  const sessions = weekDays.filter((d) => (d.practiceMinutes ?? 0) > 0).length;
  const minutes = weekDays.reduce((sum, d) => sum + (d.practiceMinutes ?? 0), 0);

  return (
    <Screen header={<BackLink label={t('common.back')} fallback="/carnet" />} title={t('carnet.week', { n: week })} subtitle={program.title}>
      <Card>
        <Text variant="label" color="primary">
          {t('carnet.sitting').toUpperCase()}
        </Text>
        <SittingPractice week={program} />
      </Card>

      <Card>
        <Text variant="label" color="primary">
          {t('carnet.weekView.sittingTitle').toUpperCase()}
        </Text>
        <Text variant="small" color="textMuted">
          {t('carnet.weekView.totals', { sessions, minutes, recommended: RECOMMENDED_DAYS_PER_WEEK })}
        </Text>
        {indexes.map((i) => (
          <DayRow
            key={i}
            dayIndex={i}
            report={byIndex.get(i)}
            onPress={byIndex.has(i) || i === today ? () => openDay(cycleId, i) : undefined}
          />
        ))}
      </Card>

      <Card>
        <Text variant="label" color="primary">
          {t('carnet.weekView.remindersTitle').toUpperCase()}
        </Text>
        <Text variant="small" color="textMuted">
          {t('carnet.reminders.scale')}
        </Text>
        {program.reminders.map((reminder, i) => (
          <ReminderRow
            key={reminder.id}
            reminder={reminder}
            showCategory={reminder.category !== program.reminders[i - 1]?.category}
            letters={indexes.map((i) => ratings.get(ratingKey(i, reminder.id)))}
            note={notesLoaded ? (notes.get(reminder.id) ?? '') : null}
            editable={editable}
            onSaveNote={(text) => void setWeekNote(cycleId, week, reminder.id, text)}
          />
        ))}
      </Card>
    </Screen>
  );
}

function DayRow({ dayIndex, report, onPress }: { dayIndex: number; report: DailyReport | undefined; onPress?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const details = report
    ? [
        report.positives && `${t('carnet.practice.positives')} : ${report.positives}`,
        (report.obstacleIds.length > 0 || report.obstacles) &&
          `${t('carnet.practice.obstacles')} : ${[labelOf(OBSTACLES, report.obstacleIds), report.obstacles].filter(Boolean).join(' — ')}`,
        (report.remedyIds.length > 0 || report.remedies) &&
          `${t('carnet.practice.remedies')} : ${[labelOf(REMEDIES, report.remedyIds), report.remedies].filter(Boolean).join(' — ')}`,
      ].filter(Boolean)
    : [];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.day, { borderTopColor: colors.border }, pressed && { opacity: 0.7 }]}>
      <View style={styles.dayHead}>
        <Text variant="label" color={report ? 'text' : 'textMuted'}>
          {`J${dayInWeek(dayIndex)}`}
        </Text>
        <Text variant="small" color="textMuted" style={styles.grow}>
          {report ? formatShortDate(report.date) : t('carnet.weekView.emptyDay')}
        </Text>
        {report?.practiceMinutes ? <Text variant="label">{t('carnet.minutesShort', { n: report.practiceMinutes })}</Text> : null}
        {onPress ? <Icon name="chevron_right" ios="chevron.right" size={20} color={colors.textMuted} /> : null}
      </View>
      {details.map((line, i) => (
        <Text key={i} variant="small" numberOfLines={2}>
          {line}
        </Text>
      ))}
    </Pressable>
  );
}

function ReminderRow({
  reminder,
  showCategory,
  letters,
  note,
  editable,
  onSaveNote,
}: {
  reminder: Reminder;
  showCategory: boolean;
  letters: (string | undefined)[];
  /** null while loading. */
  note: string | null;
  editable: boolean;
  onSaveNote: (text: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.reminder, { borderTopColor: colors.border }]}>
      {showCategory ? (
        <Text variant="label" color="heading">
          {t(`carnet.reminders.categories.${reminder.category}`).toUpperCase()}
        </Text>
      ) : null}
      <Text>{reminder.label}</Text>
      <View style={styles.grid}>
        {letters.map((letter, i) => (
          <View key={i} style={styles.cell}>
            <Text variant="small" color="textMuted">{`J${i + 1}`}</Text>
            <View
              style={[
                styles.letter,
                letter ? { backgroundColor: colors.surfaceAccent, borderColor: colors.primary } : { borderColor: colors.border },
              ]}>
              <Text variant="label" color={letter ? 'primary' : 'textMuted'}>
                {letter ?? '·'}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {note === null ? null : editable ? (
        <AutosaveField
          accessibilityLabel={`${t('carnet.weekView.observations')} — ${reminder.label}`}
          placeholder={t('carnet.weekView.observationsPlaceholder')}
          initial={note}
          onSave={onSaveNote}
        />
      ) : note ? (
        <Text variant="small" color="textMuted">{`${t('carnet.weekView.observations')} : ${note}`}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  day: { gap: 2, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 32 },
  reminder: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  grid: { flexDirection: 'row', gap: spacing.xs },
  cell: { flex: 1, alignItems: 'center', gap: 2 },
  letter: { width: '100%', minHeight: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: radius.sm },
});
