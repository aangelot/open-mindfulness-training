import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';
import { Icon, ProgressBar, Text } from '@/ui';

import { resolveTrackUri, trackSeconds } from './offline';

const SKIP_SECONDS = 10;

export const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

interface Props {
  /** Original url of the book audio (Section.audioUrl). */
  url: string;
  /** Shown on the lock screen and in the media notification. */
  title: string;
  artist?: string;
}

/**
 * Inline player for one audio: play/pause, ±10 s, tap-to-seek progress.
 * Keeps playing with the screen locked (lock screen controls are required on Android).
 */
export function AudioPlayerBar({ url, title, artist = 'Open Mindfulness' }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  // If the light version cannot be streamed, fall back to the site's original file.
  const [useOriginal, setUseOriginal] = useState(false);
  const player = useAudioPlayer({ uri: useOriginal ? url : resolveTrackUri(url) }, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const activated = useRef(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      if (s.error) setUseOriginal(true);
    });
    return () => sub.remove();
  }, [player]);

  const duration = status.duration || trackSeconds(url) || 0;
  const ended = status.didJustFinish || (duration > 0 && status.currentTime >= duration - 0.5);

  async function toggle() {
    if (status.playing) {
      player.pause();
      return;
    }
    if (!activated.current) {
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
      player.setActiveForLockScreen(true, { title, artist }, { showSeekBackward: true, showSeekForward: true });
      activated.current = true;
    }
    if (ended) await player.seekTo(0);
    player.play();
  }

  const skip = (delta: number) => player.seekTo(Math.min(duration, Math.max(0, status.currentTime + delta)));
  const seek = (e: GestureResponderEvent) => {
    if (width > 0 && duration > 0) player.seekTo((e.nativeEvent.locationX / width) * duration);
  };

  const loading = status.playing && status.isBuffering;

  return (
    <View style={[styles.bar, { backgroundColor: colors.surfaceAccent }]}>
      <View style={styles.controls}>
        <Pressable accessibilityLabel={t('audio.back10')} hitSlop={8} onPress={() => skip(-SKIP_SECONDS)}>
          <Icon name="replay_10" ios="gobackward.10" color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? t('audio.pause') : t('audio.play')}
          onPress={toggle}
          style={[styles.play, { backgroundColor: colors.primary }]}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Icon name={status.playing ? 'pause' : 'play_arrow'} ios={status.playing ? 'pause.fill' : 'play.fill'} size={30} color={colors.onPrimary} />
          )}
        </Pressable>
        <Pressable accessibilityLabel={t('audio.forward10')} hitSlop={8} onPress={() => skip(SKIP_SECONDS)}>
          <Icon name="forward_10" ios="goforward.10" color={colors.primary} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={t('audio.position')}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onPress={seek}
        style={styles.seek}>
        <ProgressBar value={duration ? status.currentTime / duration : 0} height={6} />
      </Pressable>
      <View style={styles.times}>
        <Text variant="small" color="textMuted">
          {formatTime(status.currentTime)}
        </Text>
        <Text variant="small" color="textMuted">
          {duration ? formatTime(duration) : '–:––'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  play: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  seek: { paddingVertical: spacing.sm },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
});
