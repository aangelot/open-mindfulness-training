import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { currentDayIndex, filledDays, localDate } from '@/core/cycle';
import { useActiveCycle } from '@/core/cycle-store';
import { openCarnet, openCarnetDay } from '@/core/links';

import { dayReminderSupported, syncDayReminders, useDayReminder } from './day-reminder';

/**
 * Keeps the evening reminders in step with the carnet (a day filled, a cycle
 * started or ended), the settings, and the calendar (each return to the app),
 * and opens the day to fill when a reminder is tapped. Needs the database.
 */
export function DayReminderSync() {
  return dayReminderSupported ? <Sync /> : null;
}

function Sync() {
  const { active, loaded } = useActiveCycle();
  const { ready, choice, time } = useDayReminder();
  const [foregrounds, setForegrounds] = useState(0);
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegrounds((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  // What the schedule depends on, as a string so a re-render with equal data does nothing.
  const today = localDate();
  const days = active?.days ?? null;
  const key = days ? `${active!.cycle.id}|${filledDays(days)}|${days.some((d) => d.date === today)}` : 'none';
  useEffect(() => {
    if (!loaded || !ready) return;
    syncDayReminders(days).catch((e: unknown) => console.warn('[day reminder]', e));
    // `days` is read through `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, ready, key, today, choice, time, foregrounds]);

  useEffect(() => {
    if (!loaded || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    if (response.notification.request.content.data?.kind !== 'day-reminder') return;
    const id = `${response.notification.request.identifier}@${response.notification.date}`;
    if (handled.current === id) return;
    handled.current = id;
    void Notifications.clearLastNotificationResponseAsync();
    const day = active ? currentDayIndex(active.days, localDate()) : null;
    if (active && day !== null) openCarnetDay(active.cycle.id, day);
    else openCarnet();
  }, [loaded, response, active]);

  return null;
}
