import { useLocalSearchParams } from 'expo-router';

import { CycleScreen } from '@/features/carnet/screens/cycle-screen';

export default function CycleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CycleScreen id={id} />;
}
