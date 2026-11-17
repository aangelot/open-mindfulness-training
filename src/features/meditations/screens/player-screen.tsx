import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { pauseSession, resumeSession, retrySession, seekSession, stopSession, useSession } from '@/core/audio/session';
import { getSectionByRef } from '@/core/book/content';
import { radius, spacing, useTheme } from '@/core/theme';
import { BackLink, Button, Icon, ProgressBar, Screen, Text } from '@/ui';

import { RefBadge } from '../components/ref-badge';
import { formatClock, formatDuration, openBookSection } from '../format';
import { lastIsRecorded, replay } from '../play';
import { MIN_RECORDED_SECONDS } from '../store';

const SKIP_SECONDS = 10;

const close = () => {
  stopSession();
  if (router.canGoBack()) router.back();
  else router.replace('/meditations');
};

/** The session playing: progress over the whole session, controls, and its parts. */
export function PlayerScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { plan, status, position, duration, partIndex, partStarts } = useSession();
  const [width, setWidth] = useState(0);
  const back = <BackLink label={t('meditations.player.back')} fallback="/meditations" />;

  if (!plan || status === 'idle') {
    return (
      <Screen header={back}>
        <Text color="textMuted">{t('meditations.player.none')}</Text>
      </Screen>
    );
  }

  const ended = status === 'ended';
  const playing = status === 'playing' || status === 'loading';
  const part = plan.parts[partIndex];
  const section = part?.ref ? getSectionByRef(part.ref) : undefined;

  const seek = (e: GestureResponderEvent) => {
    if (width > 0 && duration > 0 && !ended) void seekSession((e.nativeEvent.locationX / width) * duration);
  };
  const confirmStop = () => {
    const body = !lastIsRecorded()
      ? t('meditations.player.stopBodyNotRecorded')
      : position < MIN_RECORDED_SECONDS
        ? t('meditations.player.stopBodyShort')
        : t('meditations.player.stopBody', { duration: formatDuration(position) });
    Alert.alert(t('meditations.player.stopTitle'), body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('meditations.player.stop'), style: 'destructive', onPress: stopSession },
    ]);
  };

  return (
    <Screen header={back} title={plan.title} subtitle={plan.subtitle}>
      <View style={[styles.panel, { backgroundColor: colors.surfaceAccent }]}>
        {ended ? (
          <View style={styles.center}>
            <Icon name="check_circle" ios="checkmark.circle.fill" size={40} color={colors.heading} />
            <Text variant="subtitle" color="heading">
              {t('meditations.player.ended')}
            </Text>
            {lastIsRecorded() ? <Text color="textMuted">{t('meditations.player.recorded')}</Text> : null}
          </View>
        ) : status === 'error' ? (
          <View style={styles.center}>
            <Icon name="cloud_off" ios="icloud.slash" size={40} color={colors.textMuted} />
            <Text style={styles.centerText}>{t('meditations.player.error')}</Text>
            <Button label={t('meditations.player.retry')} icon="refresh" iosIcon="arrow.clockwise" onPress={() => void retrySession()} />
          </View>
        ) : (
          <>
            <View style={styles.center}>
              <Text variant="title" color="heading" accessibilityRole="timer">
                {formatClock(duration - position)}
              </Text>
              {part && plan.parts.length > 1 ? (
                <Text color="textMuted" style={styles.centerText}>
                  {part.label}
                </Text>
              ) : null}
            </View>
            <View style={styles.controls}>
              <Pressable
                accessibilityLabel={t('meditations.player.back10')}
                hitSlop={8}
                onPress={() => void seekSession(position - SKIP_SECONDS)}>
                <Icon name="replay_10" ios="gobackward.10" color={colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={playing ? t('audio.pause') : t('audio.play')}
                onPress={playing ? pauseSession : resumeSession}
                style={[styles.play, { backgroundColor: colors.primary }]}>
                {status === 'loading' ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Icon name={playing ? 'pause' : 'play_arrow'} ios={playing ? 'pause.fill' : 'play.fill'} size={34} color={colors.onPrimary} />
                )}
              </Pressable>
              <Pressable
                accessibilityLabel={t('meditations.player.forward10')}
                hitSlop={8}
                onPress={() => void seekSession(position + SKIP_SECONDS)}>
                <Icon name="forward_10" ios="goforward.10" color={colors.primary} />
              </Pressable>
            </View>
          </>
        )}
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel={t('meditations.player.position')}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          onPress={seek}
          style={styles.seek}>
          <ProgressBar value={duration ? position / duration : 0} height={6} />
        </Pressable>
        <View style={styles.times}>
          <Text variant="small" color="textMuted">
            {formatClock(position)}
          </Text>
          <Text variant="small" color="textMuted">
            {formatClock(duration)}
          </Text>
        </View>
      </View>

      {ended ? (
        <View style={styles.buttons}>
          <Button label={t('meditations.player.restart')} icon="replay" iosIcon="arrow.counterclockwise" onPress={replay} />
          <Button label={t('meditations.player.back')} variant="secondary" onPress={close} />
        </View>
      ) : (
        <Button label={t('meditations.player.stop')} variant="secondary" icon="stop" iosIcon="stop.fill" onPress={confirmStop} />
      )}

      {section && !ended ? (
        <Pressable accessibilityRole="link" onPress={() => openBookSection(section.id)} hitSlop={6}>
          <Text color="link">{t('meditations.player.readText')}</Text>
        </Pressable>
      ) : null}

      {plan.parts.length > 1 ? (
        <View style={[styles.parts, { borderColor: colors.border }]}>
          {plan.parts.map((p, i) => {
            const current = i === partIndex && !ended;
            return (
              <View key={i} style={[styles.partRow, { borderBottomColor: colors.border }]}>
                <Text variant="small" color={current ? 'primary' : 'textMuted'} style={styles.partTime}>
                  {formatClock(partStarts[i] ?? 0)}
                </Text>
                <View style={styles.partRef}>{p.ref ? <RefBadge refName={p.ref} /> : null}</View>
                <View style={styles.grow}>
                  <Text color={current ? 'text' : 'textMuted'} style={current ? styles.bold : undefined}>
                    {p.label}
                  </Text>
                  {p.silent ? (
                    <Text variant="small" color="textMuted">
                      {t('meditations.player.silentPart')}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.xs },
  centerText: { textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  play: { width: 64, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  seek: { paddingVertical: spacing.sm },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.sm },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  parts: { borderTopWidth: StyleSheet.hairlineWidth },
  partRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  partTime: { minWidth: 40, paddingTop: 3 },
  partRef: { minWidth: 40 },
  grow: { flex: 1 },
  bold: { fontWeight: '600' },
});
