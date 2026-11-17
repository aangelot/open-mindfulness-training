import { useLocalSearchParams } from 'expo-router';

import { DayScreen } from '@/features/carnet/screens/day-screen';

/** `day` is 1-based in the URL ("jour/12"). */
export default function DayRoute() {
  const { id, day } = useLocalSearchParams<{ id: string; day: string }>();
  return <DayScreen key={`${id}:${day}`} cycleId={id} dayIndex={Number(day) - 1} />;
}
