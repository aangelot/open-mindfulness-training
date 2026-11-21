import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useSession } from '@/core/audio/session';
import { spacing, useTheme } from '@/core/theme';
import { Card, Icon, ProgressBar, Text } from '@/ui';

import { formatClock, openPlayer } from '../format';

/** Shortcut back to the player while a session plays (it continues when leaving the player). Hidden once it has ended. */
export function CurrentSessionCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { plan, status, position, duration } = useSession();
  if (!plan || status === 'idle' || status === 'ended') return null;
  const playing = status === 'playing' || status === 'loading';
  return (
    <Card onPress={openPlayer}>
      <View style={styles.row}>
        <Icon name={playing ? 'graphic_eq' : 'pause_circle'} ios={playing ? 'waveform' : 'pause.circle'} color={colors.primary} />
        <View style={styles.grow}>
          <Text variant="label" color="primary">
            {t('meditations.current').toUpperCase()}
          </Text>
          <Text numberOfLines={1}>{plan.title}</Text>
        </View>
        <Text variant="small" color="textMuted">
          {t('meditations.player.remaining', { time: formatClock(duration - position) })}
        </Text>
      </View>
      <ProgressBar value={duration ? position / duration : 0} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
});
