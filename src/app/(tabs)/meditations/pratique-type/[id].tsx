import { useLocalSearchParams } from 'expo-router';

import { SittingScreen } from '@/features/meditations/screens/sitting-screen';

export default function SittingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SittingScreen id={id} />;
}
