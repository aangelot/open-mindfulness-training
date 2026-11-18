/**
 * Evening reminder to fill the day in the carnet: the app's only notification.
 *
 * Local notifications, scheduled on the device (no server, no push token). The
 * user is asked once, right after starting a cycle; the Profile turns it on or
 * off and sets the time. See evenings.ts for which evenings are reminded.
 */
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import Storage from 'expo-sqlite/kv-store';
import { Alert, Linking, Platform } from 'react-native';
import { create } from 'zustand';

import { localDate, type DayRef } from '@/core/cycle';
import { i18n } from '@/core/i18n';

import { formatReminderTime, parseReminderTime, reminderEvenings, type ReminderTime } from './evenings';

/** Local notifications do not exist on web. */
export const dayReminderSupported = Platform.OS !== 'web';

const CHANNEL_ID = 'carnet-soir';
/** Identifiers of the scheduled reminders: prefix + YYYY-MM-DD. */
const ID_PREFIX = 'carnet-soir-';
const CHOICE_KEY = 'dayReminder.choice';
const TIME_KEY = 'dayReminder.time';

/** null: never asked. */
type Choice = 'on' | 'off' | null;

interface DayReminderState {
  /** False until the settings are read: nothing is scheduled or cancelled before. */
  ready: boolean;
  choice: Choice;
  time: ReminderTime;
}

export const useDayReminder = create<DayReminderState>(() => ({ ready: false, choice: null, time: parseReminderTime(null) }));
const set = useDayReminder.setState;
const t = i18n.t.bind(i18n);

/** Reads the settings; call once at startup. */
export function initDayReminder() {
  // Web: nothing to schedule, and the kv-store would make a sync SQLite call at startup.
  if (!dayReminderSupported) return;
  set({
    ready: true,
    choice: Storage.getItemSync(CHOICE_KEY) as Choice,
    time: parseReminderTime(Storage.getItemSync(TIME_KEY)),
  });
  // Shown even with the app open: it is the only notification, and only at the chosen time.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

function setChoice(choice: Exclude<Choice, null>) {
  Storage.setItemSync(CHOICE_KEY, choice);
  set({ choice });
}

export function setDayReminderTime(time: ReminderTime) {
  Storage.setItemSync(TIME_KEY, formatReminderTime(time));
  set({ time });
}

/** Android 13+ shows the permission prompt only once a channel exists. */
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: t('dayReminder.channel'),
    description: t('dayReminder.channelDescription'),
    importance: AndroidImportance.DEFAULT,
  });
}

/** Asks for the permission and turns the reminder on; false when refused. */
export async function enableDayReminder(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  const { granted, canAskAgain } = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (granted) {
    setChoice('on');
    return true;
  }
  setChoice('off');
  // Refused for good: only the system settings can allow it now.
  if (!canAskAgain) {
    Alert.alert(t('dayReminder.blockedTitle'), t('dayReminder.blockedBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('dayReminder.openSettings'), onPress: () => void Linking.openSettings() },
    ]);
  }
  return false;
}

export function disableDayReminder() {
  setChoice('off');
}

/** After starting a cycle: offers the reminder, once. */
export function offerDayReminder() {
  if (!dayReminderSupported || useDayReminder.getState().choice !== null) return;
  Alert.alert(t('dayReminder.offerTitle'), t('dayReminder.offerBody', { time: formatReminderTime(useDayReminder.getState().time) }), [
    { text: t('dayReminder.later'), style: 'cancel', onPress: disableDayReminder },
    { text: t('dayReminder.enable'), onPress: () => void enableDayReminder() },
  ]);
}

/** Whether the system currently lets the app notify (the user may revoke it in the settings). */
export async function notificationsAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/**
 * Brings the scheduled reminders in line with the cycle in progress (`days`, null
 * when none) and the settings. Safe to call often: identifiers are per date.
 */
export async function syncDayReminders(days: readonly DayRef[] | null, now = new Date()) {
  if (!dayReminderSupported) return;
  const { ready, choice, time } = useDayReminder.getState();
  if (!ready) return;
  const evenings = choice === 'on' ? reminderEvenings(days, time, now) : [];
  const wanted = new Map(evenings.map((date) => [ID_PREFIX + localDate(date), date]));

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (request.identifier.startsWith(ID_PREFIX) && !wanted.has(request.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }
  if (wanted.size === 0) return;
  await ensureChannel();
  for (const [identifier, date] of wanted) {
    // Scheduling an existing identifier replaces it (the time may have changed).
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title: t('dayReminder.title'), body: t('dayReminder.body'), data: { kind: 'day-reminder' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
    });
  }
}
