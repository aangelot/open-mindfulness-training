import { useLocalSearchParams } from 'expo-router';

import { WeekScreen } from '@/features/carnet/screens/week-screen';

export default function WeekRoute() {
  const { id, week } = useLocalSearchParams<{ id: string; week: string }>();
  return <WeekScreen key={`${id}:${week}`} cycleId={id} week={Number(week)} />;
}
