import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/core/theme';
import { BackLink, Card, Chip, Icon, Screen, Text, TextField } from '@/ui';

import { AutosaveField } from '../components/autosave-field';
import { RatingPicker } from '../components/rating-picker';
import { RefLink, SittingPractice } from '../components/sitting-practice';
import { TOTAL_DAYS, currentDayIndex, dayInWeek, localDate, programWeek, weekOf } from '../cycle';
import { formatDate } from '../format';
import { OBSTACLES, OBSTACLES_REF, REMEDIES, type ReminderCategory } from '../program';
import { ratingKey, saveDay, setRating, useCycleDays, useCycleRatings, useCycles } from '../store';

const CATEGORIES: ReminderCategory[] = ['instantane', 'petite_pause', 'situation'];
const QUICK_MINUTES = [20, 30, 40];

/** Daily entry: sitting practice report, then the day's reminders rated A–E. */
export function DayScreen({ cycleId, dayIndex }: { cycleId: string; dayIndex: number }) {
  const { t } = useTranslation();
  const { cycles, loaded: cyclesLoaded } = useCycles();
  const { days, loaded } = useCycleDays(cycleId);
  const ratings = useCycleRatings(cycleId);
  const cycle = cycles.find((c) => c.id === cycleId);
  const back = <BackLink label={t('common.back')} fallback="/carnet" />;

  if (!cyclesLoaded || !loaded) return <Screen header={back} />;
  const report = days.find((d) => d.dayIndex === dayIndex);
  const editable = cycle?.status === 'active';
  const reachable = report || (editable && currentDayIndex(days, localDate()) === dayIndex);
  if (!cycle || !reachable || dayIndex < 0 || dayIndex >= TOTAL_DAYS) {
    return (
      <Screen header={back}>
        <Text>{t('carnet.dayNotFound')}</Text>
      </Screen>
    );
  }

  const week = programWeek(weekOf(dayIndex));
  const save = (patch: Parameters<typeof saveDay>[2]) => void saveDay(cycleId, dayIndex, patch);

  return (
    <Screen
      header={back}
      title={t('carnet.dayOf', { day: dayIndex + 1, total: TOTAL_DAYS })}
      subtitle={`${t('carnet.dayWeek', { week: week.week, day: dayInWeek(dayIndex) })} · ${formatDate(report?.date ?? localDate())}`}>
      {!editable ? (
        <Text color="textMuted">{t('carnet.readOnly', { status: t(`carnet.status.${cycle.status}`).toLowerCase() })}</Text>
      ) : null}

      <Card>
        <Text variant="label" color="primary">
          {t('carnet.practice.title').toUpperCase()}
        </Text>
        <SittingReminder week={week} />
        <View style={styles.fields}>
          <DurationField initial={report?.practiceMinutes ?? null} editable={editable} onSave={(practiceMinutes) => save({ practiceMinutes })} />
          <AutosaveField
            label={t('carnet.practice.positives')}
            initial={report?.positives ?? ''}
            editable={editable}
            onSave={(positives) => save({ positives })}
          />
          <TagField
            label={t('carnet.practice.obstacles')}
            options={OBSTACLES}
            selected={report?.obstacleIds ?? []}
            editable={editable}
            onChange={(obstacleIds) => save({ obstacleIds })}
            note={report?.obstacles ?? ''}
            onSaveNote={(obstacles) => save({ obstacles })}
          />
          <TagField
            label={t('carnet.practice.remedies')}
            options={REMEDIES}
            selected={report?.remedyIds ?? []}
            editable={editable}
            onChange={(remedyIds) => save({ remedyIds })}
            note={report?.remedies ?? ''}
            onSaveNote={(remedies) => save({ remedies })}
          />
          <View style={styles.inline}>
            <RefLink refName={OBSTACLES_REF} />
            <Text variant="small" color="textMuted" style={styles.grow}>
              {t('carnet.practice.aboutObstacles')}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text variant="label" color="primary">
          {t('carnet.reminders.title').toUpperCase()}
        </Text>
        <Text variant="small" color="textMuted">
          {`${t('carnet.reminders.help')} ${t('carnet.reminders.scale')}`}
        </Text>
        {CATEGORIES.map((category) => {
          const reminders = week.reminders.filter((r) => r.category === category);
          if (reminders.length === 0) return null;
          return (
            <View key={category} style={styles.category}>
              <Text variant="label" color="heading">
                {t(`carnet.reminders.categories.${category}`).toUpperCase()}
              </Text>
              {reminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminder}>
                  <Text>{reminder.label}</Text>
                  <RatingPicker
                    value={ratings.get(ratingKey(dayIndex, reminder.id))}
                    disabled={!editable}
                    onChange={(rating) => void setRating(cycleId, dayIndex, reminder.id, rating)}
                  />
                </View>
              ))}
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

/** Collapsible reminder of the week's "pratique assise type". */
function SittingReminder({ week }: { week: ReturnType<typeof programWeek> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fields}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        hitSlop={6}
        style={styles.inline}>
        <Text color="link" style={styles.grow}>
          {`${t('carnet.sitting')} — ${week.title}`}
        </Text>
        <Icon name={open ? 'expand_less' : 'expand_more'} ios={open ? 'chevron.up' : 'chevron.down'} color={colors.link} />
      </Pressable>
      {open ? <SittingPractice week={week} /> : null}
    </View>
  );
}

function DurationField({ initial, editable, onSave }: { initial: number | null; editable: boolean; onSave: (minutes: number | null) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initial === null ? '' : String(initial));
  const update = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 3);
    setText(digits);
    onSave(digits ? Number(digits) : null);
  };
  return (
    <View style={styles.fields}>
      <TextField
        label={t('carnet.practice.duration')}
        multiline={false}
        keyboardType="number-pad"
        placeholder={t('carnet.practice.durationPlaceholder')}
        value={text}
        editable={editable}
        onChangeText={update}
      />
      {editable ? (
        <View style={styles.chips}>
          {QUICK_MINUTES.map((m) => (
            <Chip key={m} label={t('carnet.minutesShort', { n: m })} selected={text === String(m)} onPress={() => update(String(m))} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TagField({
  label,
  options,
  selected,
  editable,
  onChange,
  note,
  onSaveNote,
}: {
  label: string;
  options: readonly { id: string; label: string }[];
  selected: readonly string[];
  editable: boolean;
  onChange: (ids: string[]) => void;
  note: string;
  onSaveNote: (text: string) => void;
}) {
  const { t } = useTranslation();
  // Local copy: two quick taps must not both start from the same saved value.
  const [ids, setIds] = useState(selected);
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((s) => s !== id) : [...ids, id];
    setIds(next);
    onChange(next);
  };
  return (
    <View style={styles.fields}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <View style={styles.chips}>
        {options.map((o) => (
          <Chip key={o.id} label={o.label} selected={ids.includes(o.id)} onPress={editable ? () => toggle(o.id) : undefined} />
        ))}
      </View>
      <AutosaveField
        accessibilityLabel={`${label} — ${t('carnet.practice.details')}`}
        placeholder={t('carnet.practice.details')}
        initial={note}
        editable={editable}
        onSave={onSaveNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  category: { gap: spacing.md, marginTop: spacing.sm },
  reminder: { gap: spacing.sm },
});
