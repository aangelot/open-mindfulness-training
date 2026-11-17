import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';
import { BackLink, Button, Card, Icon, ProgressBar, Screen, Text } from '@/ui';

import { confirmStartCycle } from '../actions';
import { TOTAL_DAYS, cycleNumbers, filledDays } from '../cycle';
import { formatDate, isoToLocalDate, openCycle } from '../format';
import { useCycleDays, useCycles, type Cycle } from '../store';

/** All cycles, newest first, and the button to start a new one. */
export function CyclesScreen() {
  const { t } = useTranslation();
  const { cycles } = useCycles();
  const numbers = cycleNumbers(cycles);
  const active = cycles.find((c) => c.status === 'active');
  const activeDays = useCycleDays(active?.id ?? '').days;
  const sorted = [...cycles].sort((a, b) => (numbers.get(b.id) ?? 0) - (numbers.get(a.id) ?? 0));

  const startNew = () =>
    confirmStartCycle(active ? { id: active.id, number: numbers.get(active.id) ?? 1, days: activeDays } : null, () =>
      router.dismissTo('/carnet'),
    );

  return (
    <Screen header={<BackLink label={t('carnet.title')} fallback="/carnet" />} title={t('carnet.history')}>
      <Button label={t('carnet.newCycle')} icon="add" iosIcon="plus" onPress={startNew} />
      {sorted.map((cycle) => (
        <CycleCard key={cycle.id} cycle={cycle} number={numbers.get(cycle.id) ?? 1} />
      ))}
    </Screen>
  );
}

function CycleCard({ cycle, number }: { cycle: Cycle; number: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { days } = useCycleDays(cycle.id);
  const filled = filledDays(days);
  const active = cycle.status === 'active';
  return (
    <Card onPress={() => (active ? router.dismissTo('/carnet') : openCycle(cycle.id))}>
      <View style={styles.row}>
        <Text variant="subtitle" style={styles.grow}>
          {t('carnet.cycle', { n: number })}
        </Text>
        <View style={[styles.badge, { backgroundColor: active ? colors.primary : colors.border }]}>
          <Text variant="label" style={{ color: active ? colors.onPrimary : colors.text }}>
            {t(`carnet.status.${cycle.status}`)}
          </Text>
        </View>
        <Icon name="chevron_right" ios="chevron.right" color={colors.textMuted} />
      </View>
      <Text variant="small" color="textMuted">
        {cycle.endedAt
          ? t('carnet.period', { start: formatDate(cycle.startDate), end: formatDate(isoToLocalDate(cycle.endedAt)) })
          : t('carnet.startedOn', { date: formatDate(cycle.startDate) })}
      </Text>
      <ProgressBar value={filled / TOTAL_DAYS} />
      <Text variant="small" color="textMuted">
        {t('carnet.daysFilled', { count: filled, total: TOTAL_DAYS })}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
});
