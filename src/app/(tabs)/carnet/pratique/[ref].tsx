import { useLocalSearchParams } from 'expo-router';

import { getSectionByRef } from '@/features/book/content';
import { SectionScreen } from '@/features/book/screens/section-screen';

/** Book section of a practice ("P10") or talk ("E8") opened from the carnet, inside the carnet stack. */
export default function CarnetPracticeRoute() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  return <SectionScreen id={getSectionByRef(ref)?.id ?? ''} embedded />;
}
