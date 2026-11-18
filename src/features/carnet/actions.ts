/** Cycle lifecycle actions, each behind a confirmation dialog. */
import { Alert } from 'react-native';

import { i18n } from '@/core/i18n';
import { offerDayReminder } from '@/core/notifications/day-reminder';

import { TOTAL_DAYS, currentDayIndex, localDate } from '@/core/cycle';
import { deleteCycle, endCycle, resumeCycle, startCycle, type DailyReport } from './store';

const t = i18n.t.bind(i18n);

export interface ActiveCycleInfo {
  id: string;
  number: number;
  days: readonly DailyReport[];
}

/** Starts a new cycle; an active one is closed (completed if its 56 days are filled, else abandoned). */
export function confirmStartCycle(active: ActiveCycleInfo | null, onStarted?: (id: string) => void) {
  // Not `onStarted?.(startCycle())`: an optional call skips evaluating its arguments.
  const start = (closeAs: 'completed' | 'abandoned') => {
    const id = startCycle(closeAs);
    onStarted?.(id);
    offerDayReminder();
  };
  if (!active) {
    start('abandoned');
    return;
  }
  const day = currentDayIndex(active.days, localDate());
  const full = day === null;
  Alert.alert(
    t('carnet.confirm.replaceTitle'),
    full
      ? t('carnet.confirm.replaceCompleteBody', { n: active.number })
      : t('carnet.confirm.replaceBody', { n: active.number, day: day + 1, total: TOTAL_DAYS }),
    [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('carnet.newCycle'), onPress: () => start(full ? 'completed' : 'abandoned') },
    ],
  );
}

export function confirmAbandon(id: string) {
  Alert.alert(t('carnet.confirm.abandonTitle'), t('carnet.confirm.abandonBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('carnet.abandon'), style: 'destructive', onPress: () => void endCycle(id, 'abandoned') },
  ]);
}

export function completeCycle(id: string) {
  void endCycle(id, 'completed');
}

/** Resumes a closed cycle; the active one (if any) is abandoned after confirmation. */
export function confirmResume(id: string, activeNumber: number | null, onResumed: () => void) {
  const resume = () => {
    resumeCycle(id);
    onResumed();
  };
  if (activeNumber === null) {
    resume();
    return;
  }
  Alert.alert(t('carnet.resume'), t('carnet.confirm.resumeBody', { n: activeNumber }), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('carnet.confirm.continue'), onPress: resume },
  ]);
}

export function confirmDelete(id: string, onDeleted: () => void) {
  Alert.alert(t('carnet.confirm.deleteTitle'), t('carnet.confirm.deleteBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('common.delete'),
      style: 'destructive',
      onPress: () => {
        deleteCycle(id);
        onDeleted();
      },
    },
  ]);
}
