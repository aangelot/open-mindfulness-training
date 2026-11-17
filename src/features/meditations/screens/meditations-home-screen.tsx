import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/core/theme';
import { Button, Card, Icon, Screen, Text } from '@/ui';

import { catalogCount } from '../catalog';
import { CurrentSessionCard } from '../components/current-session-card';
import { formatDuration, openAddSession, openCatalog, openHistory, openSitting, openTimer, sittingTitle, thisWeek } from '../format';
import { SITTING_SESSIONS } from '../sitting-sessions';
import { useSessions } from '../store';

export function MeditationsHomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { sessions } = useSessions();
  const week = thisWeek(sessions);

  return (
    <Screen title={t('meditations.title')} subtitle={t('meditations.subtitle')}>
      <CurrentSessionCard />

      <View style={styles.section}>
        <Text variant="subtitle" color="heading">
          {t('meditations.sitting.title')}
        </Text>
        <Text color="textMuted">{t('meditations.sitting.intro')}</Text>
      </View>
      {SITTING_SESSIONS.map((def) => (
        <Card key={def.id} onPress={() => openSitting(def.id)}>
          <View style={styles.row}>
            <View style={styles.grow}>
              <Text>{sittingTitle(def)}</Text>
              <Text variant="small" color="textMuted">
                {t('meditations.sitting.durations')}
              </Text>
            </View>
            <Icon name="chevron_right" ios="chevron.right" size={20} color={colors.textMuted} />
          </View>
        </Card>
      ))}

      <Card onPress={openTimer}>
        <View style={styles.row}>
          <Icon name="timer" ios="timer" color={colors.primary} />
          <View style={styles.grow}>
            <Text variant="subtitle" color="heading">
              {t('meditations.timer.title')}
            </Text>
            <Text variant="small" color="textMuted">
              {t('meditations.timer.summary')}
            </Text>
          </View>
        </View>
      </Card>

      <Card onPress={openCatalog}>
        <View style={styles.row}>
          <Icon name="headphones" ios="headphones" color={colors.primary} />
          <View style={styles.grow}>
            <Text variant="subtitle" color="heading">
              {t('meditations.catalog.title')}
            </Text>
            <Text variant="small" color="textMuted">
              {t('meditations.catalog.summary', { count: catalogCount })}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Text variant="subtitle" color="heading">
          {t('meditations.history.title')}
        </Text>
        <Text color="textMuted">
          {t('meditations.history.thisWeek', { count: week.count, duration: formatDuration(week.seconds) })}
        </Text>
      </View>
      <View style={styles.buttons}>
        <Button label={t('meditations.history.add')} icon="add" iosIcon="plus" onPress={openAddSession} />
        <Button label={t('meditations.history.seeAll')} variant="secondary" onPress={openHistory} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1, gap: 2 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
