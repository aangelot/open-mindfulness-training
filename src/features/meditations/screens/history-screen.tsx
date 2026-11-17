import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { i18n } from '@/core/i18n';
import { spacing, useTheme } from '@/core/theme';
import { BackLink, Button, Icon, Screen, Text } from '@/ui';

import { formatDay, formatDuration, formatTime, localDay, openAddSession, sessionLabel, thisWeek } from '../format';
import { deleteSession, useSessions, type MeditationSession } from '../store';

/** Sessions grouped by local day, most recent first. */
function byDay(sessions: readonly MeditationSession[]) {
  const days = new Map<string, MeditationSession[]>();
  for (const s of sessions) {
    const key = localDay(new Date(s.startedAt));
    days.set(key, [...(days.get(key) ?? []), s]);
  }
  return [...days.values()];
}

function confirmDelete(session: MeditationSession) {
  const t = i18n.t.bind(i18n);
  const body = t('meditations.history.deleteBody', {
    label: sessionLabel(session),
    day: formatDay(new Date(session.startedAt)).toLowerCase(),
    time: formatTime(session.startedAt),
    duration: formatDuration(session.durationSeconds),
  });
  Alert.alert(t('meditations.history.deleteTitle'), body, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.delete'), style: 'destructive', onPress: () => void deleteSession(session.id) },
  ]);
}

export function HistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { sessions, loaded } = useSessions();
  const week = thisWeek(sessions);
  const total = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);

  return (
    <Screen header={<BackLink label={t('meditations.title')} fallback="/meditations" />} title={t('meditations.history.title')}>
      {sessions.length > 0 ? (
        <View style={styles.summary}>
          <Text>{t('meditations.history.thisWeek', { count: week.count, duration: formatDuration(week.seconds) })}</Text>
          <Text color="textMuted">{t('meditations.history.total', { count: sessions.length, duration: formatDuration(total) })}</Text>
        </View>
      ) : loaded ? (
        <Text color="textMuted">{t('meditations.history.empty')}</Text>
      ) : null}
      <Button label={t('meditations.history.add')} icon="add" iosIcon="plus" onPress={openAddSession} />

      {byDay(sessions).map((day) => (
        <View key={day[0].id} style={styles.day}>
          <Text variant="label" color="heading" style={[styles.dayTitle, { borderBottomColor: colors.border }]}>
            {formatDay(new Date(day[0].startedAt)).toUpperCase()}
          </Text>
          {day.map((s) => (
            <View key={s.id} style={styles.row}>
              <Text variant="small" color="textMuted" style={styles.time}>
                {formatTime(s.startedAt)}
              </Text>
              <Text style={styles.grow}>{sessionLabel(s)}</Text>
              <Text variant="small" color="textMuted">
                {formatDuration(s.durationSeconds)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('meditations.history.delete', { time: formatTime(s.startedAt) })}
                hitSlop={8}
                onPress={() => confirmDelete(s)}>
                <Icon name="delete" ios="trash" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.xs },
  day: { gap: 2 },
  dayTitle: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  time: { minWidth: 44 },
  grow: { flex: 1 },
});
