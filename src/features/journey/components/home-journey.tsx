import { useActiveCycle } from '@/core/cycle-store';

import { StartCard } from './start-card';
import { WeekCard } from './week-card';

/** Home screen guide: "Cette semaine" during a cycle, otherwise the path through the method. */
export function HomeJourney() {
  const { active, cycles, loaded } = useActiveCycle();
  if (!loaded) return null;
  return active ? <WeekCard active={active} /> : <StartCard cycles={cycles} />;
}
