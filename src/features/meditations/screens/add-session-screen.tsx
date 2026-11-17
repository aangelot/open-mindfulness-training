import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';
import { BackLink, Button, Icon, Screen, Text, TextField } from '@/ui';

import { MinutesPicker } from '../components/minutes-picker';
import { formatDay, localDay, parseTime } from '../format';
import { recordSession } from '../store';

const DURATIONS = [10, 15, 20, 30, 40, 45, 60] as const;
const MAX_MINUTES = 600;
const DEFAULT_MINUTES = 20;

const pad = (n: number) => String(n).padStart(2, '0');

/** A session just done: it started DEFAULT_MINUTES ago, rounded down to 5 minutes. */
function defaultStart() {
  const d = new Date(Date.now() - DEFAULT_MINUTES * 60_000);
  return `${pad(d.getHours())}:${pad(d.getMinutes() - (d.getMinutes() % 5))}`;
}

/** A meditation done without the app: date, start time, duration. */
export function AddSessionScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [day, setDay] = useState(() => new Date());
  const [time, setTime] = useState(defaultStart);
  const [minutes, setMinutes] = useState<number | null>(DEFAULT_MINUTES);
  const [submitted, setSubmitted] = useState(false);
  const [future, setFuture] = useState(false);
  const [today] = useState(() => localDay(new Date()));

  const isToday = localDay(day) === today;
  const shiftDay = (delta: number) => {
    setFuture(false);
    setDay((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() + delta);
      return next;
    });
  };

  const parsed = parseTime(time);
  const start = parsed ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), parsed[0], parsed[1]) : null;
  const error = !parsed
    ? t('meditations.add.invalidTime')
    : minutes === null
      ? t('meditations.add.invalidDuration', { max: MAX_MINUTES })
      : future
        ? t('meditations.add.future')
        : null;

  const save = async () => {
    setSubmitted(true);
    if (!start || minutes === null || !parsed) return;
    // Checked on save only: "now" must not be read while rendering.
    const inFuture = start.getTime() > Date.now();
    setFuture(inFuture);
    if (inFuture) return;
    await recordSession({ kind: 'manual', contentRef: null, startedAt: start.toISOString(), durationSeconds: minutes * 60 });
    if (router.canGoBack()) router.back();
    else router.replace('/meditations/historique');
  };

  return (
    <Screen
      header={<BackLink label={t('meditations.title')} fallback="/meditations" />}
      title={t('meditations.add.title')}
      subtitle={t('meditations.add.intro')}>
      <View style={styles.block}>
        <Text variant="label" color="textMuted">
          {t('meditations.add.date').toUpperCase()}
        </Text>
        <View style={[styles.stepper, { borderColor: colors.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('meditations.add.previousDay')} hitSlop={8} onPress={() => shiftDay(-1)}>
            <Icon name="chevron_left" ios="chevron.left" color={colors.primary} />
          </Pressable>
          <Text style={styles.dayLabel}>{formatDay(day)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('meditations.add.nextDay')}
            accessibilityState={{ disabled: isToday }}
            disabled={isToday}
            hitSlop={8}
            onPress={() => shiftDay(1)}>
            <Icon name="chevron_right" ios="chevron.right" color={isToday ? colors.border : colors.primary} />
          </Pressable>
        </View>
      </View>

      <TextField
        label={t('meditations.add.time')}
        multiline={false}
        value={time}
        onChangeText={(text) => {
          setFuture(false);
          setTime(text);
        }}
        placeholder={t('meditations.add.timePlaceholder')}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={styles.timeField}
      />

      <View style={styles.block}>
        <Text variant="label" color="textMuted">
          {t('meditations.add.duration').toUpperCase()}
        </Text>
        <MinutesPicker options={DURATIONS} value={minutes} onChange={setMinutes} customLabel={t('meditations.add.custom')} max={MAX_MINUTES} />
      </View>

      {submitted && error ? <Text color="link">{error}</Text> : null}
      <Button label={t('meditations.add.save')} icon="check" iosIcon="checkmark" onPress={() => void save()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dayLabel: { flex: 1, textAlign: 'center' },
  timeField: { maxWidth: 140 },
});
