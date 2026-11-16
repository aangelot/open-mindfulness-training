import { useTranslation } from 'react-i18next';

import { OfflineAudioSettings } from '@/core/audio/offline-audio-card';
import { supabase } from '@/core/supabase/client';
import { Card, Screen, Text } from '@/ui';

export default function ProfileScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t('profile.title')}>
      <Card>
        <Text>{t('profile.noAccount')}</Text>
        {supabase ? null : (
          <Text variant="small" color="textMuted">
            {t('profile.syncUnavailable')}
          </Text>
        )}
      </Card>
      <OfflineAudioSettings />
    </Screen>
  );
}
