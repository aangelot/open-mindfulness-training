import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme';
import { BackLink, Button, Chip, Screen, Text } from '@/ui';

import { MinutesPicker } from '../components/minutes-picker';
import { playTimer } from '../play';
import { MAX_TIMER_MINUTES, TIMER_INTERVALS, TIMER_MINUTES, bellTimes } from '../timer';

export function TimerScreen() {
  const { t } = useTranslation();
  const [minutes, setMinutes] = useState<number | null>(20);
  const [interval, setBellInterval] = useState<number>(0);

  return (
    <Screen
      header={<BackLink label={t('meditations.title')} fallback="/meditations" />}
      title={t('meditations.timer.title')}
      subtitle={t('meditations.timer.summary')}>
      <View style={styles.block}>
        <Text variant="label" color="textMuted">
          {t('meditations.timer.duration').toUpperCase()}
        </Text>
        <MinutesPicker
          options={TIMER_MINUTES}
          value={minutes}
          onChange={setMinutes}
          customLabel={t('meditations.timer.custom')}
          max={MAX_TIMER_MINUTES}
        />
      </View>
      <View style={styles.block}>
        <Text variant="label" color="textMuted">
          {t('meditations.timer.interval').toUpperCase()}
        </Text>
        <View style={styles.chips}>
          {TIMER_INTERVALS.map((n) => (
            <Chip
              key={n}
              label={n === 0 ? t('meditations.timer.none') : t('meditations.timer.every', { n })}
              selected={n === interval}
              onPress={() => setBellInterval(n)}
            />
          ))}
        </View>
      </View>
      {minutes === null ? (
        <Text color="textMuted">{t('meditations.timer.invalid', { max: MAX_TIMER_MINUTES })}</Text>
      ) : (
        <Text variant="small" color="textMuted">
          {t('meditations.timer.bells', { count: bellTimes({ minutes, interval }).length })}
        </Text>
      )}
      <Button
        label={t('meditations.timer.start')}
        icon="play_arrow"
        iosIcon="play.fill"
        disabled={minutes === null}
        onPress={() => minutes !== null && playTimer({ minutes, interval })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
