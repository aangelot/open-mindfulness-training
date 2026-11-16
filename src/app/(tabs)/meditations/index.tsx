import { useTranslation } from 'react-i18next';

import { Screen, Text } from '@/ui';

export default function MeditationsScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t('meditations.title')}>
      <Text color="textMuted">{t('meditations.comingSoon')}</Text>
    </Screen>
  );
}
