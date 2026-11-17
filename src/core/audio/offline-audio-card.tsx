import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme';
import { Button, Card, ProgressBar, Text } from '@/ui';

import {
  audioManifest,
  declineOfflineAudio,
  deleteOfflineAudio,
  downloadOfflineAudio,
  offlineAudioAvailable,
  offlineFileCount,
  pauseOfflineAudio,
  useOfflineAudio,
} from './offline';

const trackCount = Object.keys(audioManifest.tracks).length;

/** "215 Mo", "1,2 Go" */
export const formatBytes = (bytes: number) =>
  bytes >= 1e9
    ? `${(bytes / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Go`
    : `${Math.max(1, Math.round(bytes / 1e6))} Mo`;

/** Home screen offer, shown until the user answers. */
export function OfflineAudioOffer() {
  const { t } = useTranslation();
  const choice = useOfflineAudio((s) => s.choice);
  if (!offlineAudioAvailable || choice !== null) return null;
  return (
    <Card>
      <Text variant="label" color="primary">
        {t('offlineAudio.title').toUpperCase()}
      </Text>
      <Text>{t('offlineAudio.offer', { count: trackCount, size: formatBytes(audioManifest.totalBytes) })}</Text>
      <View style={styles.actions}>
        <Button label={t('offlineAudio.download')} icon="download" iosIcon="arrow.down.circle" onPress={downloadOfflineAudio} />
        <Button label={t('offlineAudio.later')} variant="secondary" onPress={declineOfflineAudio} />
      </View>
    </Card>
  );
}

/** Profile section: progress and controls. */
export function OfflineAudioSettings() {
  const { t } = useTranslation();
  const { downloading, error, doneCount, doneBytes } = useOfflineAudio();
  if (!offlineAudioAvailable) return null;

  const complete = doneCount === offlineFileCount;
  const remaining = audioManifest.totalBytes - doneBytes;

  return (
    <Card>
      <Text variant="label" color="primary">
        {t('offlineAudio.title').toUpperCase()}
      </Text>
      {complete ? (
        <Text>{t('offlineAudio.complete', { count: trackCount, size: formatBytes(doneBytes) })}</Text>
      ) : (
        <>
          <Text>
            {doneCount === 0 && !downloading
              ? t('offlineAudio.streaming', { count: offlineFileCount, size: formatBytes(audioManifest.totalBytes) })
              : t('offlineAudio.progress', { done: doneCount, total: offlineFileCount, size: formatBytes(doneBytes) })}
          </Text>
          {doneCount > 0 || downloading ? <ProgressBar value={doneBytes / audioManifest.totalBytes} /> : null}
        </>
      )}
      {error ? (
        <Text variant="small" color="heading">
          {error === 'space' ? t('offlineAudio.errorSpace', { size: formatBytes(remaining) }) : t('offlineAudio.errorNetwork')}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {downloading ? (
          <Button label={t('offlineAudio.pause')} variant="secondary" icon="pause" iosIcon="pause" onPress={pauseOfflineAudio} />
        ) : !complete ? (
          <Button
            label={doneCount > 0 ? t('offlineAudio.resume') : t('offlineAudio.download')}
            icon="download"
            iosIcon="arrow.down.circle"
            onPress={downloadOfflineAudio}
          />
        ) : null}
        {doneCount > 0 && !downloading ? (
          <Button label={t('offlineAudio.delete')} variant="secondary" icon="delete" iosIcon="trash" onPress={deleteOfflineAudio} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
});
