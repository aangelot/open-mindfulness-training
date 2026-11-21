import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { currentWeek, localDate } from '@/core/cycle';
import { useActiveCycle } from '@/core/cycle-store';
import { spacing, useTheme } from '@/core/theme';
import { Button, Card, Icon, Screen, Text } from '@/ui';

import { catalogCount } from '../catalog';
import { CurrentSessionCard } from '../components/current-session-card';
import { formatDuration, openAddSession, openCatalog, openHistory, openSitting, openTimer, sittingMinutes, sittingTitle, thisWeek } from '../format';
import { SITTING_SESSIONS, type SittingSessionDef } from '../sitting-sessions';
import { useSessions } from '../store';

export function MeditationsHomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { sessions } = useSessions();
  const week = thisWeek(sessions);
  const { active } = useActiveCycle();
  const yourWeek = active ? { cycle: active.number, week: currentWeek(active.days, localDate()) } : null;

  return (
    <Screen title={t('meditations.title')} subtitle={t('meditations.subtitle')}>
      <CurrentSessionCard />

      {yourWeek ? (
        <>
          <View style={styles.section}>
            <Text variant="subtitle" color="heading">
              {t('meditations.yourWeek.title')}
            </Text>
            <Text color="textMuted">{t('meditations.yourWeek.intro', { cycle: yourWeek.cycle, week: yourWeek.week })}</Text>
          </View>
          {SITTING_SESSIONS.filter((def) => def.week === yourWeek.week).map((def) => (
            <SittingCard key={def.id} def={def} />
          ))}
        </>
      ) : null}

      <View style={styles.section}>
        <Text variant="subtitle" color="heading">
          {t('meditations.sitting.title')}
        </Text>
        <Text color="textMuted">{t('meditations.sitting.intro')}</Text>
      </View>
      {SITTING_SESSIONS.map((def) => (
        <SittingCard key={def.id} def={def} current={def.week === yourWeek?.week} />
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

function SittingCard({ def, current }: { def: SittingSessionDef; current?: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Card onPress={() => openSitting(def.id)}>
      <View style={styles.row}>
        <View style={styles.grow}>
          <Text>{sittingTitle(def)}</Text>
          <Text variant="small" color="textMuted">
            {current ? `${sittingMinutes(def)} · ${t('meditations.yourWeek.badge')}` : sittingMinutes(def)}
          </Text>
        </View>
        <Icon name="chevron_right" ios="chevron.right" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1, gap: 2 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
