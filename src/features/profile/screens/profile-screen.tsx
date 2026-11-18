import Constants from 'expo-constants';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { OfflineAudioSettings } from '@/core/audio/offline-audio-card';
import { readingOrder, readingStatus } from '@/core/book/content';
import { i18n } from '@/core/i18n';
import { formatDuration } from '@/core/format';
import { DayReminderSettings } from '@/core/notifications/day-reminder-card';
import { spacing } from '@/core/theme';
import { Button, Card, ListRow, Screen, Text } from '@/ui';

import { StatTiles } from '../components/charts';
import { LINKS, openExternal, openLegal, openPage, openPrivacy, openStats } from '../links';
import { secondsByDay, streaks } from '../stats';
import { eraseAllData, useReadSectionIds, useSessionRefs } from '../store';

function confirmErase() {
  const t = i18n.t.bind(i18n);
  Alert.alert(t('profile.data.eraseTitle'), t('profile.data.eraseBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('profile.data.eraseConfirm'), style: 'destructive', onPress: eraseAllData },
  ]);
}

function Label({ children }: { children: string }) {
  return (
    <Text variant="label" color="primary">
      {children.toUpperCase()}
    </Text>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t('profile.title')}>
      <PracticeSummary />
      <Card>
        <Label>{t('profile.donate.title')}</Label>
        <Text>{t('profile.donate.body')}</Text>
        <View style={styles.action}>
          <Button label={t('profile.donate.button')} icon="favorite" iosIcon="heart" onPress={() => openExternal(LINKS.donate)} />
        </View>
      </Card>
      <Card>
        <Label>{t('profile.site.title')}</Label>
        <ListRow label={t('profile.site.site')} detail={t('profile.site.siteDetail')} icon="language" ios="globe" external onPress={() => openPage(LINKS.site)} />
        <ListRow
          label={t('profile.site.seminars')}
          detail={t('profile.site.seminarsDetail')}
          icon="groups"
          ios="person.3"
          external
          onPress={() => openPage(LINKS.seminars)}
        />
        <ListRow
          label={t('profile.site.structures')}
          detail={t('profile.site.structuresDetail')}
          icon="account_balance"
          ios="building.columns"
          external
          onPress={() => openPage(LINKS.structures)}
        />
        <ListRow
          label={t('profile.site.contact')}
          detail={t('profile.site.contactDetail')}
          icon="mail"
          ios="envelope"
          external
          last
          onPress={() => openPage(LINKS.contact)}
        />
      </Card>
      <DayReminderSettings />
      <OfflineAudioSettings />
      <Card>
        <Label>{t('profile.data.title')}</Label>
        <Text>{t('profile.data.body')}</Text>
        <View style={styles.action}>
          <Button label={t('profile.data.erase')} variant="secondary" icon="delete" iosIcon="trash" onPress={confirmErase} />
        </View>
      </Card>
      <Card>
        <Label>{t('profile.app.title')}</Label>
        <ListRow label={t('profile.app.privacy')} icon="lock" ios="lock" onPress={openPrivacy} />
        <ListRow label={t('profile.app.legal')} icon="info" ios="info.circle" onPress={openLegal} />
        <ListRow
          label={t('profile.app.feedback')}
          detail={t('profile.app.feedbackDetail')}
          icon="feedback"
          ios="exclamationmark.bubble"
          external
          onPress={() => openPage(LINKS.issues)}
        />
        <ListRow
          label={t('profile.app.source')}
          detail={t('profile.app.sourceDetail')}
          icon="code"
          ios="chevron.left.forwardslash.chevron.right"
          external
          last
          onPress={() => openPage(LINKS.repo)}
        />
      </Card>
      <Text variant="small" color="textMuted" style={styles.version}>
        {t('profile.app.version', { version: Constants.expoConfig?.version ?? '' })}
      </Text>
    </Screen>
  );
}

/** Three key figures and the way to the full statistics. */
function PracticeSummary() {
  const { t } = useTranslation();
  const { sessions } = useSessionRefs();
  const readIds = useReadSectionIds();
  const { total, current } = useMemo(
    () => ({ total: sessions.reduce((sum, s) => sum + s.durationSeconds, 0), current: streaks(secondsByDay(sessions)).current }),
    [sessions],
  );
  return (
    <Card>
      <Label>{t('profile.practice')}</Label>
      <View style={styles.tiles}>
        <StatTiles
          tiles={[
            { value: formatDuration(total), label: t('profile.stats.totalTime') },
            { value: t('profile.stats.days', { count: current }), label: t('profile.stats.currentStreak') },
            { value: `${readingStatus(readingOrder, readIds).read}/${readingOrder.length}`, label: t('profile.sectionsRead') },
          ]}
        />
      </View>
      <View style={styles.action}>
        <Button label={t('profile.stats.seeAll')} variant="secondary" icon="bar_chart" iosIcon="chart.bar" onPress={openStats} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tiles: { marginTop: spacing.xs },
  action: { flexDirection: 'row', marginTop: spacing.sm },
  version: { textAlign: 'center' },
});
