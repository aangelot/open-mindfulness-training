import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { radius, spacing, useTheme } from '@/core/theme';
import { Button, Card, Icon, Text } from '@/ui';

import {
  dayReminderSupported,
  disableDayReminder,
  enableDayReminder,
  notificationsAllowed,
  setDayReminderTime,
  useDayReminder,
} from './day-reminder';
import { formatReminderTime, shiftReminderTime } from './evenings';

const STEP_MINUTES = 15;

/** Profile section: the evening reminder on or off, and its time. */
export function DayReminderSettings() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { choice, time } = useDayReminder();
  const on = choice === 'on';
  const allowed = useNotificationsAllowed(on);
  if (!dayReminderSupported) return null;

  const toggle = (value: boolean) => (value ? void enableDayReminder() : disableDayReminder());
  const shift = (minutes: number) => setDayReminderTime(shiftReminderTime(time, minutes));
  const formatted = formatReminderTime(time);

  return (
    <Card>
      <Text variant="label" color="primary">
        {t('dayReminder.settingsTitle').toUpperCase()}
      </Text>
      <View style={styles.row}>
        <Text style={styles.grow}>{t('dayReminder.switch')}</Text>
        <Switch
          accessibilityLabel={t('dayReminder.switch')}
          value={on}
          onValueChange={toggle}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>
      <Text variant="small" color="textMuted">
        {t('dayReminder.settingsBody')}
      </Text>
      {on ? (
        <View style={styles.row}>
          <Text style={styles.grow}>{t('dayReminder.time')}</Text>
          <Stepper icon="remove" ios="minus" label={t('dayReminder.earlier')} onPress={() => shift(-STEP_MINUTES)} />
          <Text variant="subtitle" accessibilityLabel={t('dayReminder.timeValue', { time: formatted })} style={styles.time}>
            {formatted}
          </Text>
          <Stepper icon="add" ios="plus" label={t('dayReminder.later15')} onPress={() => shift(STEP_MINUTES)} />
        </View>
      ) : null}
      {on && allowed === false ? (
        <>
          <Text variant="small" color="heading">
            {t('dayReminder.blockedBody')}
          </Text>
          <View style={styles.action}>
            <Button label={t('dayReminder.openSettings')} variant="secondary" icon="settings" iosIcon="gear" onPress={() => void Linking.openSettings()} />
          </View>
        </>
      ) : null}
    </Card>
  );
}

function Stepper({ icon, ios, label, onPress }: { icon: 'add' | 'remove'; ios: 'plus' | 'minus'; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.stepper, { backgroundColor: colors.surfaceAccent }, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} ios={ios} size={20} color={colors.primary} />
    </Pressable>
  );
}

/** System permission, checked again on each return to the app (it may be changed in the settings). */
function useNotificationsAllowed(enabled: boolean): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    if (!dayReminderSupported || !enabled) return;
    const check = () => void notificationsAllowed().then(setAllowed);
    check();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => sub.remove();
  }, [enabled]);
  return allowed;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  grow: { flex: 1 },
  time: { minWidth: 64, textAlign: 'center' },
  stepper: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  action: { flexDirection: 'row', marginTop: spacing.xs },
});
