import { useTranslation } from 'react-i18next';

import { PROGRAM } from '@/features/carnet/program';
import { Card, Screen, Text } from '@/ui';

export default function CarnetScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t('carnet.title')}>
      {PROGRAM.map((week) => (
        <Card key={week.week}>
          <Text variant="label" color="primary">
            {t('carnet.week', { n: week.week }).toUpperCase()}
          </Text>
          <Text variant="subtitle">{week.title}</Text>
          <Text variant="small" color="textMuted">
            {t('carnet.sittingMinutes', { min: week.sitting.totalMinutes[0], max: week.sitting.totalMinutes[1] })}
            {' · '}
            {t('carnet.remindersCount', { count: week.reminders.length })}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
