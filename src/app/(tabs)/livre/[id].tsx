import { useLocalSearchParams } from 'expo-router';

import { SectionScreen } from '@/features/book/screens/section-screen';

export default function BookSectionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SectionScreen id={id} />;
}
